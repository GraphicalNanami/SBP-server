import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferLeadershipDto {
  @ApiProperty({ description: 'UUID of the team member to transfer leadership to' })
  @IsUUID()
  @IsNotEmpty()
  newLeadUuid: string;
}
