import { Gender } from '@/src/common/enums/gender.enum';
import { UserRole } from '@/src/common/enums/user-role.enum';

export class ProfileResponseDto {
  user: {
    _id: string;
    email: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  profile: {
    firstName?: string;
    lastName?: string;
    gender?: Gender;
    city?: string;
    country?: string;
    website?: string;
    profilePictureUrl?: string;
    bio?: string;
    stellarAddress?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
  };
  experience?: any; // To be typed later
  wallets?: any[]; // To be typed later
}
