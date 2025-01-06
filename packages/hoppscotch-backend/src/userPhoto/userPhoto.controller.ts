import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GqlUser } from 'src/decorators/gql-user.decorator';
import { AuthUser } from 'src/types/AuthUser';
import { existsSync } from 'fs';
import { ConfigService } from '@nestjs/config';

@Controller({ path: 'photo/me', version: '1' })
export class UserPhotoController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getImage(@Res() res: Response, @GqlUser() user: AuthUser) {
    //console.log('UserPhotoController -> getImage -> user', user);
    // Download the user's photo from Azure AD
    let photoBasePath = this.configService.get('PHOTO_BASE_PATH');
    // remove trailing slash
    if (photoBasePath.endsWith('/')) {
      photoBasePath = photoBasePath.slice(0, -1);
    }

    let userImage = `${photoBasePath}/${user.uid}.jpg`;
    // check if the image exists
    const imageExists = existsSync(userImage);
    if (!imageExists) {
      console.log("user image doesn't exist, using default image");
      userImage = `${photoBasePath}/default.jpg`;
    }

    const imageStream = createReadStream(userImage);
    imageStream.on('open', () => {
      imageStream.pipe(res);
    });

    imageStream.on('error', () => {
      res.status(500).send('An error occurred while reading the image.');
    });
  }
}
