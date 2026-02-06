import { IsUUID } from 'class-validator';

export class MemberParamsDto {
  @IsUUID(4, { message: 'Invalid Organization UUID format' })
  id: string;

  @IsUUID(4, { message: 'Invalid Member UUID format' })
  memberId: string;
}
