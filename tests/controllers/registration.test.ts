import express from 'express';
import request from 'supertest';
import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import routes from '../../src/routes';
import { User } from '../../src/models';

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
app.use('/api/v1', routes)


describe('User Registration', () => {
  describe('Successful Registration', () => {
    it('should register a new user with all valid fields', async () => {
      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'ValidPass123!'
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('name', 'John Doe');
      expect(res.body.user).toHaveProperty('email', 'john@example.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should trim and split name into first and last name', async () => {
      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'John Doe    Dee ',
        email: 'john@example.com',
        password: 'ValidPass123!'
      });

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('name', 'John Doe Dee');
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
      expect(res.body).toHaveProperty('error');
    });

    it('should fail when password is too short', async () => {
      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail when name is missing', async () => {
      const res = await request(app).post('/api/v1/registration/signup').send({
        email: 'john@example.com',
        password: 'ValidPass123!'
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail when name is too long', async () => {
      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'JohnDipatinoJonsoRomeroTwoCompute Doe JohnDipatinoJonsoRomeroTwoCompute',
        email: 'john@example.com',
        password: 'ValidPass123!'
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toEqual('User validation failed: firstName: First name cannot exceed 30 characters, lastName: Last name cannot exceed 30 characters');
    });
  });

  describe('Duplicate Registration', () => {
    it('should fail when email already exists', async () => {
      await request(app).post('/api/v1/registration/signup').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'ValidPass123!'
      });

      const res = await request(app).post('/api/v1/registration/signup').send({
        name: 'Another John',
        email: 'john@example.com',
        password: 'AnotherPass123!'
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
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

  // describe('Delete User', () => {
  //   it('should delete user successfully', async () => {

  //     const res = await request(app).delete('/api/v1/registration/delete').send({
  //       email: 'john@example.com',
  //       password: 'ValidPass123!'
  //     });

  //     expect(res.status).toBe(200);
  //   });
  // });

  // describe('Update User', () => {
  //   it('should update user successfully', async () => {
  //     const res = await request(app).post('/api/v1/registration/update').send({
  //       email: 'john@example.com',
  //       password: 'ValidPass123!'
  //     });
  //   });
  // });
});
