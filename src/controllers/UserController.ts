import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import { createHash } from '../utils';
import { validate } from '../validator';

class UserController {
  static getAll = async (req: Request, res: Response) => {
    //Get users from database
    const userRepository = getRepository(User);
    const users = await userRepository.find({
      select: ['id', 'rut', 'lastConnection'],
    });
    res.send(users);
  };

  static getOne = async (req: Request, res: Response) => {
    //Get the ID from the url
    const rut = req.params.rut;
    //Get the user from database
    const userRepository = getRepository(User);
    try {
      const user = await userRepository.findOneOrFail({
        where: { rut },
        select: ['id', 'rut', 'lastConnection'],
      });
      res.send(user);
    } catch (error) {
      res.status(404).send('User not found');
    }
  };

  static createOne = async (req: Request, res: Response) => {
    const { body: data } = req;
    const valid = validate(data);
    if (!valid)
      res.status(400).json({ success: false, errors: validate.errors });
    //Get the user from database
    const userRepository = getRepository(User);
    try {
      let user: User | undefined;
      const { rut } = data;
      const password = createHash(data.password);
      user = await userRepository.findOne({
        where: {
          rut,
          password,
        },
      });
      if (user)
        return res.status(400).json({
          success: false,
          errors: ['user already exists'],
        });

      user = new User();
      user.rut = rut;
      user.password = password;
      await userRepository.save(user);
      res.send(user);
    } catch (error) {
      res.status(500).send({ success: false, message: error.message });
    }
  };
}

export default UserController;
