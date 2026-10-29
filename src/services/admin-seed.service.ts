import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../entities/user-role.enum';
import { UserRepository } from '../repositories/user.repository';
import { normalizeEmail } from '../utils/email.util';
import { hashPassword } from '../utils/hash.util';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    const email = normalizeEmail(
      this.configService.getOrThrow<string>('ADMIN_EMAIL'),
    );

    if (await this.userRepository.existsByEmail(email)) {
      return;
    }

    await this.userRepository.create({
      name: this.configService.getOrThrow<string>('ADMIN_NAME'),
      email,
      password: await hashPassword(
        this.configService.getOrThrow<string>('ADMIN_PASSWORD'),
      ),
      roles: [UserRole.ADMIN],
    });

    this.logger.log(`Initial administrator created: ${email}`);
  }
}
