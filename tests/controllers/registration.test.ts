import express from 'express';
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import routes from '../../src/routes';
import { User, Vote, UserRole, IUser } from '../../src/models';
import { testVote, testPoll, testUser } from '../factories';

beforeAll(async () => {
    await dbConnect();
});

beforeEach(async () => {
    await dropDatabase();
    await User.syncIndexes();
});

afterAll(async () => {
    await dbDisconnect();
});

const app = express();
app.use(express.json());
app.use('/api/v1', routes);


describe('User Registration', () => {
  describe('Successful Registration', () => {
    it('should register a new user with all valid fields', async () => {
      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'ValidPass123!'
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('name', 'John Doe');
      expect(res.body.data.user).toHaveProperty('email', 'john@example.com');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should trim and split name into first and last name', async () => {
      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'John Doe    Dee ',
        email: 'john@example.com',
        password: 'ValidPass123!'
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('name', 'John Doe Dee');
    });
  });

  describe('Validation Failures', () => {
    it('should fail when email is invalid', async () => {
      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'ValidPass123!'
      });

      expect(res.status).toBe(400);
    });

    it('should fail when password is too short', async () => {
      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      });

      expect(res.status).toBe(400);
    });

    it('should fail when name is missing', async () => {
      const res = await request(app).post('/api/v1/registration/signup').send({
        email: 'john@example.com',
        password: 'ValidPass123!'
      });

      expect(res.status).toBe(400);
    });

    it('should fail when name is too long', async () => {
      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'JohnDipatinoJonsoRomeroTwoCompute Doe JohnDipatinoJonsoRomeroTwoCompute',
        email: 'john@example.com',
        password: 'ValidPass123!'
      });

      expect(res.status).toBe(400);
    });
  });

  describe('Duplicate Registration', () => {
    it('should fail when email already exists', async () => {
      await request(app).post('/api/v1/registration/signup').send({
        name: 'John Doe',
        email: 'john1@example.com',
        password: 'ValidPass123!'
      });

      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'Another John',
        email: 'john1@example.com',
        password: 'AnotherPass123!'
      });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBe("User validation failed: email: Email already exists");
    });
  });

  describe('Password Security', () => {
    it('should not store password in plain text', async () => {
      const password = 'ValidPass123!';
      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'John Doe',
        email: 'john@example.com',
        password
      });

      expect(res.status).toBe(200);
      const user = await User.findOne({ email: 'john@example.com' });
      expect(user?.password).not.toBe(password);
    });
  });

  describe('Update User', () => {
    beforeEach(async () => {
      await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'ValidPass123!'
      });
    });

    it('should update user successfully', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'john@example.com',
        password: 'ValidPass123!'
      });

      const token = loginRes.body.data.token;

      const res = await request(app).post('/api/v1/registration/update').set('Authorization', `Bearer ${token}`).send({
        name: 'John Doe Updated',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'User updated successfully');
    });
  });

  describe('Delete User', () => {
    beforeEach(async () => {
      await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'ValidPass123!'
      });
    });

    it('should delete user successfully', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'john@example.com',
        password: 'ValidPass123!'
      });

      const token = loginRes.body.data.token;

      const res = await request(app).delete('/api/v1/registration/delete').set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'User deleted successfully');
    });
  });

  describe('Match new user with existing votes', () => {
    it('should match new user with existing votes', async () => {
      const admin = await testUser({ role: UserRole.Admin }).save();
      const poll = await testPoll({ creatorId: admin.id }).save();
      const pollOptionId = poll.pollOptions[0]._id;

      await testVote({ voterIp: '127.0.0.1', voterId: undefined, pollId: poll.id, pollOptionId }).save();
      await testVote({ voterIp: '127.0.0.1', voterId: undefined, pollId: poll.id, pollOptionId }).save();
      await testVote({ voterIp: '127.0.0.1', voterId: undefined, pollId: poll.id, pollOptionId }).save();

      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'ValidPass123!'
      });


      const nonAuthUser = await User.findById(res.body.data.user.id) as IUser;
      const votes = await nonAuthUser.votes();

      expect(res.status).toBe(200);
      expect(nonAuthUser).toBeDefined();
      expect(votes).toHaveLength(3);
    });
  });
});