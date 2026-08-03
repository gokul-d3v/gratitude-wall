import { Request, Response, NextFunction } from 'express';
import { Team } from '../models/Team';

export const getTeamsHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teams = await Team.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

export const createTeamHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Team name is required' });
      return;
    }

    const team = await Team.create({ name: name.trim(), description: description || '' });
    res.status(201).json({ success: true, data: team });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Team with this name already exists' });
      return;
    }
    next(error);
  }
};

export const deleteTeamHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teamId = req.params.id;
    await Team.deleteOne({ _id: teamId });
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    next(error);
  }
};
