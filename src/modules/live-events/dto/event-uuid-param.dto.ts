
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class EventUuidParamDto {
  @ApiProperty({ 
    description: 'The UUID of the event (can be full UUID or custom identifier like "6" or "mock-event-id")',
    example: 'eaec7550-1f4a-4ec2-8b20-d017a50e2b21'
  })
  @IsString()
  @IsNotEmpty()
  eventUuid: string;
}
