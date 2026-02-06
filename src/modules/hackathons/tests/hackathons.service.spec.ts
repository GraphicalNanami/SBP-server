import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HackathonsService } from '../hackathons.service';
import { Hackathon } from '../schemas/hackathon.schema';
import { MembersService } from '../../organizations/members.service';
import { ConflictException, ForbiddenException } from '@nestjs/common';

describe('HackathonsService', () => {
  let service: HackathonsService;
  let model: any;
  let membersService: any;

  const mockHackathonModel = function (dto) {
    this.name = dto.name;
    this.save = jest.fn().mockResolvedValue(this);
  };
  mockHackathonModel.findOne = jest.fn();
  mockHackathonModel.exists = jest.fn();

  const mockMembersService = {
    getMember: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonsService,
        {
          provide: getModelToken(Hackathon.name),
          useValue: mockHackathonModel,
        },
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
      ],
    }).compile();

    service = module.get<HackathonsService>(HackathonsService);
    model = module.get(getModelToken(Hackathon.name));
    membersService = module.get(MembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user123';
    const createDto = {
      name: 'Test Hackathon',
      organizationId: 'org123',
      category: 'DEFI' as any,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      submissionDeadline: new Date(Date.now() + 172800000).toISOString(),
      venue: 'Virtual',
      adminContact: 'test@example.com',
      description: 'Test description',
    };

    it('should throw ForbiddenException if user is not a member', async () => {
      mockMembersService.getMember.mockResolvedValue(null);

      await expect(service.create(userId, createDto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if hackathon name already exists in org', async () => {
      mockMembersService.getMember.mockResolvedValue({ userId });
      mockHackathonModel.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.create(userId, createDto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
