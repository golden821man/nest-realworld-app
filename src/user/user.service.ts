import { Component, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './create-user.dto';
const sha256 = require('crypto-js/sha256');
const hmacSHA512 = require('crypto-js/hmac-sha512');
const Base64 = require('crypto-js/enc-base64');
const jwt = require('jsonwebtoken');
import { SECRET } from '../config';
import { UserRO } from './user.interface';

@Component()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async create(userData: CreateUserDto): Promise<UserRO> {

    const hashDigest = sha256(userData.password);
    const hmacDigest = Base64.stringify(hmacSHA512(hashDigest, SECRET));

    let user = new User();
    user.username = userData.username;
    user.email = userData.email;
    user.password = hmacDigest;

    const savedUser = await this.userRepository.save(user);
    const userRO = {
      username: savedUser.username,
      email: savedUser.email,
      bio: savedUser.bio,
      token: this.generateJWT(savedUser),
      image: null
    };

    return {user: userRO};
  }

  async update(email: string, userData: any): Promise<User> {
    let toUpdate = await this.userRepository.findOne({ email: email});
    let updated = Object.assign(toUpdate, userData);
    return await this.userRepository.save(updated);
  }

  async delete(email: string): Promise<void> {
    return await this.userRepository.delete({ email: email});
  }


  generateJWT(user) {
    let today = new Date();
    let exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign({
      id: user.id,
      username: user.username,
      exp: exp.getTime() / 1000,
    }, SECRET);
  };
}