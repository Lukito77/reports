import { UserDocument } from '../models'; // ან საიდანაც აიმპორტებ იუზერის დოკუმენტის ტიპს

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      emailVerified: boolean;
      tokenVersion: number;
    }
    
    interface Request {
      user?: User;
    }
  }
}