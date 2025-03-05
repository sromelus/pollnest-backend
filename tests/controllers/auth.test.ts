import request from "supertest";
import express from "express";
import routes from "../../src/routes";
import { dbConnect, dbDisconnect, dropDatabase } from "../helpers/dbTestConfig";
import { User, IUser, UserRole } from "../../src/models";
import { testUser, testPoll, testVote } from "../factories";
import { generateAuthAccessToken, generateRefreshToken, generatePublicPollShareToken } from "../../src/utils";
import "../../src/loadEnvironmentVariables";
import cookieParser from "cookie-parser";
import { getCookieValue } from "../helpers/getCookieValue";
import { decodeToken } from "../../src/utils/jwtManager";
import { JWT_EXPIRATION } from "../../src/constants/jwt";


beforeAll(async () => {
    await dbConnect();
});

beforeEach(async () => {
    await dropDatabase();
});

afterAll(async () => {
    await dbDisconnect();
});


const app = express();

app.use(cookieParser());
app.use(express.json());
app.use('/api/v1', routes);

describe('Auth Controller', () => {
    beforeEach(async () => {
        await testUser({email: "john@example.com", password: "ValidPass123!", verified: true}).save();
    });

    describe('.login', () => {
        it('should login user successfully', async () => {
            const res = await request(app).post('/api/v1/auth/login').send({
                email: 'john@example.com',
                password: 'ValidPass123!'
            });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Login successful');
            expect(res.headers['auth-access-token']).toBeDefined();
        });

        it('should not login user with invalid credentials', async () => {
            const res = await request(app).post('/api/v1/auth/login').send({
                email: 'john@example.com',
                password: 'InvalidPass123!'
            });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('message', 'Invalid credentials');
        });
    });

    describe('.logout', () => {
        it('should logout user successfully', async () => {
            const loginRes = await request(app).post('/api/v1/auth/login').send({
                email: 'john@example.com',
                password: 'ValidPass123!'
            });

            const authAccessToken = loginRes.headers['auth-access-token'];
            const cookies: unknown = loginRes.headers['set-cookie'];
            const refreshToken = getCookieValue(cookies as string[], 'refreshToken');

            const logoutRes = await request(app)
              .post('/api/v1/auth/logout')
              .set('Authorization', `Bearer ${authAccessToken}`)
              .set('Cookie', `refreshToken=${refreshToken}`);

            expect(logoutRes.status).toBe(200);
            expect(logoutRes.body).toHaveProperty('message', 'Logout successful');
        });

        it('should update last login and logout dates', async () => {
          const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: 'john@example.com',
            password: 'ValidPass123!'
          });

          const authAccessToken = loginRes.headers['auth-access-token'];
          const cookies: unknown = loginRes.headers['set-cookie'];
          const refreshToken = getCookieValue(cookies as string[], 'refreshToken');

          await request(app)
              .post('/api/v1/auth/logout')
              .set('Authorization', `Bearer ${authAccessToken}`)
              .set('Cookie', `refreshToken=${refreshToken}`);

          const user = await User.findOne({ email: 'john@example.com' }) as IUser;
          const lastLoginAt: number = user.lastLoginAt?.getTime() ?? 0;
          const lastLogoutAt: number = user.lastLogoutAt?.getTime() ?? 0;

          expect(lastLoginAt).not.toBeNull();
          expect(lastLogoutAt).not.toBeNull();
          expect(lastLoginAt).toBeLessThan(lastLogoutAt);
        });

        it('should unset refreshToken cookie', async () => {
          const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: 'john@example.com',
            password: 'ValidPass123!'
          });

          const authAccessToken = loginRes.headers['auth-access-token'];
          const cookies: unknown = loginRes.headers['set-cookie'];
          const refreshToken = getCookieValue(cookies as string[], 'refreshToken');

          const logoutRes = await request(app)
              .post('/api/v1/auth/logout')
              .set('Authorization', `Bearer ${authAccessToken}`)
              .set('Cookie', `refreshToken=${refreshToken}`);

          const unsetCookies: unknown = logoutRes.headers['set-cookie'];
          const unsetRefreshToken = getCookieValue(unsetCookies as string[], 'refreshToken');

          expect(unsetRefreshToken).toBeDefined();
          expect(unsetRefreshToken).not.toBeNull();
        });

        it('should not be able to access protected route after logout', async () => {
            const user = await testUser({
              email: 'new-user@example.com',
              role: UserRole.User,
              verified: true,
              password: 'ValidPass123!'
            }).save();

            const loginRes = await request(app).post('/api/v1/auth/login').send({
              email: user.email,
              password: 'ValidPass123!'
            });

            const cookies: unknown = loginRes.headers['set-cookie'];
            const authAccessToken = loginRes.headers['auth-access-token'];
            const refreshToken = getCookieValue(cookies as string[], 'refreshToken');

            const logoutRes = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${authAccessToken}`)
                .set('Cookie', `refreshToken=${refreshToken}`);

            const unsetCookie: unknown = logoutRes.headers['set-cookie'];
            const unsetRefreshToken = getCookieValue(unsetCookie as string[], 'refreshToken');

            // try to access protected route
            const res = await request(app).get('/api/v1/polls/my_polls')
                .set('Authorization', `Bearer ${authAccessToken}`)
                .set('Cookie', `refreshToken=${unsetRefreshToken}`);

            expect(res.status).toBe(401);
        });
    });

    describe('.preRegister', () => {
      it('should create a temporary user successfully', async () => {
        const tempUser = { email: 'new-user@example.com', phone: '1112223333' };
        const res = await request(app).post('/api/v1/auth/pre-register').send({
          email: tempUser.email,
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Temporary user created successfully');
        expect(res.body.data.user).toHaveProperty('email', tempUser.email);
        expect(res.body.data.user).not.toHaveProperty('password');
        expect(res.body.data.user).not.toHaveProperty('verificationCode');

        const user = await User.findOne({ email: tempUser.email }) as IUser;
        expect(user).toBeDefined();
        expect(user.firstName).toBe('New');
        expect(user.lastName).toBe('User');
        expect(user.email).toBe(tempUser.email);
        expect(user.verified).toBe(false);
        expect(user.verificationCode).toBeDefined();
        expect(user.verificationCode).toHaveLength(6);
      });

      it('should update existing unverified temporary user when email already exists', async () => {
        const tempUser = { email: 'new-user@example.com', phone: '1112223333' };

        // create existing temporary user
        await request(app).post('/api/v1/auth/pre-register').send({
            email: tempUser.email,
        });

        // create new temporary user with same email
        const res = await request(app).post('/api/v1/auth/pre-register').send({
            email: tempUser.email,
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Temporary user created successfully');
        expect(res.body.data.user).toHaveProperty('email', 'new-user@example.com');
        expect(res.body.data.user).not.toHaveProperty('password');
        expect(res.body.data.user).not.toHaveProperty('verificationCode');

        const user = await User.findOne({ email: tempUser.email }) as IUser;
        expect(user).toBeDefined();
        expect(user.firstName).toBe('New');
        expect(user.lastName).toBe('User');
        expect(user.email).toBe(tempUser.email);
        expect(user.verified).toBe(false);
        expect(user.verificationCode).toBeDefined();
        expect(user.verificationCode).toHaveLength(6);
      });

      it('it should fail when email exists and is already verified', async () => {
        const tempUser = { email: 'new-user@example.com', phone: '1112223333' };

        await testUser({ email: tempUser.email, verified: true }).save();

        const res = await request(app).post('/api/v1/auth/pre-register').send({
          email: tempUser.email,
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Email already exists');
      });

      it('should fail when email is invalid', async () => {
        const res = await request(app).post('/api/v1/auth/pre-register').send({
          email: 'invalid-email',
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Invalid email');
      });
    });

    describe('.register', () => {
      it('should register a new user successfully', async () => {
        const tempUser = { email: 'john1@example.com', phone: '1112223333' };

        await request(app).post('/api/v1/auth/pre-register').send({
          email: tempUser.email,
        });

        const user1 = await User.findOne({ email: tempUser.email, verified: false }) as IUser;
        const user2 = await User.findOne({ email: tempUser.email, verified: false, verificationCode: user1.verificationCode }) as IUser;

        const res = await request(app).post('/api/v1/auth/register').send({
          name: 'John Doe',
          email: user2.email,
          password: 'ValidPass123!',
          verificationCode: user2.verificationCode
        });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('User created successfully');
        expect(res.body.data.user).toHaveProperty('name', 'John Doe');
        expect(res.body.data.user).toHaveProperty('email', 'john1@example.com');
        expect(res.body.data.user).not.toHaveProperty('password');

        const user = await User.findOne({ email: tempUser.email }) as IUser;
        expect(user).toBeDefined();
        expect(user.verified).toBe(true);
        expect(user.verificationCode).toBeNull();
      });

      it('should register a new user with referrerId when referrerToken is provided', async () => {
        const referrer = await testUser({ email: 'referrer@example.com', verified: true, role: UserRole.Subscriber }).save();
        const poll = await testPoll({ creatorId: referrer.id }).save();
        const referrerToken = generatePublicPollShareToken({ pollId: poll.id, referrerId: referrer.id });

        const tempUser = { email: 'john1@example.com', phone: '1112223333' };

        await request(app).post('/api/v1/auth/pre-register').send({
          email: tempUser.email,
        });

        const user1 = await User.findOne({ email: tempUser.email, verified: false }) as IUser;
        const user2 = await User.findOne({ email: tempUser.email, verified: false, verificationCode: user1.verificationCode }) as IUser;

        await request(app)
          .post('/api/v1/auth/register')
          .set('Cookie', `referrerToken=${referrerToken}`)
          .send({
            name: 'John Doe',
            email: user2.email,
            password: 'ValidPass123!',
            verificationCode: user2.verificationCode
          });

        const user = await User.findOne({ email: tempUser.email }) as IUser;

        expect(user.referrerId.toString()).toEqual(referrer.id);
      });

      it('should fail when verification code is invalid', async () => {
        const res = await request(app).post('/api/v1/auth/register').send({
          name: 'John Doe',
          email: 'john1@example.com',
          password: 'ValidPass123!',
          verificationCode: '123456'
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid email or verification code');
      });

      it('should fail when email is invalid', async () => {
        const tempUser = { email: 'john1@example.com', phone: '1112223333' };

        await request(app).post('/api/v1/auth/pre-register').send({
          email: tempUser.email,
        });

        const user1 = await User.findOne({ email: tempUser.email, verified: false }) as IUser;
        const user2 = await User.findOne({ email: tempUser.email, verified: false, verificationCode: user1.verificationCode }) as IUser;

        const res = await request(app).post('/api/v1/auth/register').send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'ValidPass123!',
          verificationCode: user2.verificationCode
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Invalid email');
      });

      it('should fail when password is too short', async () => {
        const tempUser = { email: 'john1@example.com', phone: '1112223333' };

        await request(app).post('/api/v1/auth/pre-register').send({
          email: tempUser.email,
        });

        const user1 = await User.findOne({ email: tempUser.email, verified: false }) as IUser;
        const user2 = await User.findOne({ email: tempUser.email, verified: false, verificationCode: user1.verificationCode }) as IUser;

        const res = await request(app).post('/api/v1/auth/register').send({
          name: 'John Doe',
          email: user2.email,
          password: '123!',
          verificationCode: user2.verificationCode
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Password must be at least 8 characters long');
      });

      it('should fail when name is missing', async () => {
        const tempUser = { email: 'john1@example.com', phone: '1112223333' };

        await request(app).post('/api/v1/auth/pre-register').send({
          email: tempUser.email,
        });

        const user1 = await User.findOne({ email: tempUser.email, verified: false }) as IUser;
        const user2 = await User.findOne({ email: tempUser.email, verified: false, verificationCode: user1.verificationCode }) as IUser;

        const res = await request(app).post('/api/v1/auth/register').send({
          email: user2.email,
          password: 'ValidPass123!',
          verificationCode: user2.verificationCode
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('firstName: Path `firstName` is required.');
      });

      it('should fail when name is too long', async () => {
        const tempUser = { email: 'john1@example.com', phone: '1112223333' };

        await request(app).post('/api/v1/auth/pre-register').send({
            email: tempUser.email,
        });

        const user1 = await User.findOne({ email: tempUser.email, verified: false }) as IUser;
        const user2 = await User.findOne({ email: tempUser.email, verified: false, verificationCode: user1.verificationCode }) as IUser;

        const res = await request(app).post('/api/v1/auth/register').send({
            name: 'JohnDipatinoJonsoRomeroTwoCompute Doe JohnDipatinoJonsoRomeroTwoCompute',
            email: user2.email,
            password: 'ValidPass123!',
            verificationCode: user2.verificationCode
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('lastName: Last name cannot exceed 30 characters, firstName: First name cannot exceed 30 characters');
      });

      it('should not store password in plain text', async () => {
        const tempUser = { email: 'john1@example.com', phone: '1112223333' };

        await request(app).post('/api/v1/auth/pre-register').send({
          email: tempUser.email,
        });

        const user1 = await User.findOne({ email: tempUser.email, verified: false }) as IUser;
        const user2 = await User.findOne({ email: tempUser.email, verified: false, verificationCode: user1.verificationCode }) as IUser;

        const res = await request(app).post('/api/v1/auth/register').send({
          name: 'John Doe',
          email: user2.email,
          password: 'ValidPass123!',
          verificationCode: user2.verificationCode
        });

        expect(res.status).toBe(201);
        const user = await User.findOne({ email: 'john@example.com' });
        expect(user?.password).not.toBe('ValidPass123!');
      });

      it('should match new user with existing votes by ip', async () => {
          // Create admin user and poll
          const admin = await testUser({ role: UserRole.Admin }).save();
          const poll = await testPoll({ creatorId: admin.id }).save();
          const pollOptionId = poll.pollOptions[0]._id;

          // Create non-auth user with ip address
          const nonAuthUser = { ip: '127.0.0.1' };

          // non-auth user votes 3 times on the poll
          await testVote({ voterIp: nonAuthUser.ip, voterId: undefined, pollId: poll.id, pollOptionId }).save();
          await testVote({ voterIp: nonAuthUser.ip, voterId: undefined, pollId: poll.id, pollOptionId }).save();
          await testVote({ voterIp: nonAuthUser.ip, voterId: undefined, pollId: poll.id, pollOptionId }).save();

          // non-auth user creates new account
          const tempUser = { email: 'john1@example.com', ip: '127.0.0.1'};

          await request(app).post('/api/v1/auth/pre-register').send({
            email: tempUser.email,
          });

          const user1 = await User.findOne({ email: tempUser.email, verified: false }) as IUser;
          const user2 = await User.findOne({ email: tempUser.email, verified: false, verificationCode: user1.verificationCode }) as IUser;

          // non-auth user registers new account
          const res = await request(app).post('/api/v1/auth/register').send({
            name: 'New User',
            email: user2.email,
            password: 'ValidPass123!',
            verificationCode: user2.verificationCode
          });

          // get new user and their votes if any
          const newUser = await User.findById(res.body.data.user.id) as IUser;
          const votes = await newUser.votes();

          expect(res.status).toBe(201);
          expect(newUser).toBeDefined();
          expect(votes).toHaveLength(3);
      });
    });

    describe('.updateProfile', () => {
        beforeEach(async () => {
          await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john1@example.com',
            password: 'ValidPass123!',
            verified: true
          });
        });

        it('should update user successfully', async () => {
          const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: 'john1@example.com',
            password: 'ValidPass123!'
          });

          const authAccessToken = loginRes.headers['auth-access-token'];
          const cookies: unknown = loginRes.headers['set-cookie'];
          const refreshToken = getCookieValue(cookies as string[], 'refreshToken');

          const res = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${authAccessToken}`)
            .set('Cookie', `refreshToken=${refreshToken}`)
            .send({ name: 'John Doe Updated' });

          expect(res.status).toBe(200);
          expect(res.body.message).toBe('User updated successfully');
          expect(res.body).toHaveProperty('message', 'User updated successfully');
        });
    });

    describe('.deleteProfile', () => {
        beforeEach(async () => {
          await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john1@example.com',
            password: 'ValidPass123!',
            verified: true
          });
        });

        it('should delete user successfully', async () => {
          const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: 'john1@example.com',
            password: 'ValidPass123!'
          });

          const authAccessToken = loginRes.headers['auth-access-token'];
          const cookies: unknown = loginRes.headers['set-cookie'];
          const refreshToken = getCookieValue(cookies as string[], 'refreshToken');

          const res = await request(app)
            .delete('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${authAccessToken}`)
            .set('Cookie', `refreshToken=${refreshToken}`);

          // expect(res.status).toBe(200);
          expect(res.body.message).toBe('User deleted successfully');
          expect(res.body).toHaveProperty('message', 'User deleted successfully');
        });
    });

    describe('Auth access token refresh', () => {
      it('should be able to access protected routes when authAccessToken is expired and refreshToken is valid', async () => {
        const subscriber = await testUser({
          email: 'subscriber@example.com',
          role: UserRole.Subscriber,
          verified: true,
          password: 'ValidPass123!'
        }).save();

        await request(app).post('/api/v1/auth/login').send({
          email: 'john@example.com',
          password: 'ValidPass123!'
        });

        const authAccessToken = await generateAuthAccessToken(subscriber.id, '0s');
        const refreshToken = generateRefreshToken(subscriber.id, JWT_EXPIRATION.REFRESH_TOKEN);

        // try to access protected route with expired authAccessToken and valid refreshToken
        const res = await request(app).get('/api/v1/polls/my_polls')
            .set('Authorization', `Bearer ${authAccessToken}`)
            .set('Cookie', `refreshToken=${refreshToken}`);

        expect(res.status).toBe(200);
        // since the authAccessToken is expired,
        // expect the authAccessToken to be reset and updated in the header
        expect(res.headers['auth-access-token']).toBeDefined();
      });

      it('should not be able to access protected routes when authAccessToken is expired and refreshToken is invalid', async () => {
        const subscriber = await testUser({
          email: 'subscriber@example.com',
          role: UserRole.Subscriber,
          verified: true,
          password: 'ValidPass123!'
        }).save();

        await request(app).post('/api/v1/auth/login').send({
          email: 'john@example.com',
          password: 'ValidPass123!'
        });

        const authAccessToken = await generateAuthAccessToken(subscriber.id, '0s');
        const refreshToken = generateRefreshToken(subscriber.id, '0s');

        // try to access protected route with expired authAccessToken and valid refreshToken
        const res = await request(app).get('/api/v1/polls/my_polls')
            .set('Authorization', `Bearer ${authAccessToken}`)
            .set('Cookie', `refreshToken=${refreshToken}`);

        expect(res.status).toBe(401);
      });

      it('should be have the same userId as the authAccessToken', async () => {
        const subscriber = await testUser({
          email: 'subscriber@example.com',
          role: UserRole.Subscriber,
          verified: true,
          password: 'ValidPass123!'
        }).save();
  
        const authAccessToken = await generateAuthAccessToken(subscriber.id);
        const refreshToken = generateRefreshToken(subscriber.id);
  
        const decodedAuthAccessToken = decodeToken(authAccessToken);
        const decodedRefreshToken = decodeToken(refreshToken);
  
        expect(decodedAuthAccessToken.userId).toBe(decodedRefreshToken.userId);
      });

      it('should not be able to access protected routes when refreshToken userId is different from authAccessToken userId', async () => {
        const janeUser = await testUser({ email: 'janed@example.com', password: 'ValidPass123!' }).save();
        const johnUser = await testUser({ email: 'johnd@example.com', password: 'ValidPass123!' }).save();
  
        const authAccessToken = await generateAuthAccessToken(johnUser.id, '0s');
        const janeRefreshToken = generateRefreshToken(janeUser.id, '3d');
  
        const logoutRes = await request(app)
          .post('/api/v1/auth/logout')
          .set('Authorization', `Bearer ${authAccessToken}`)
          .set('Cookie', `refreshToken=${janeRefreshToken}`);
  
        expect(logoutRes.status).toBe(403);
      });
    });
});
