import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { existsSync } from 'fs';
import { ConfigService } from '@nestjs/config';

@Controller({ path: 'files/', version: '1' })
export class FileServeController {
  constructor(private readonly configService: ConfigService) {}

  sendFile(res: Response, filename: string, contentType: string) {
    let photoBasePath = this.configService.get('PHOTO_BASE_PATH');
    // remove trailing slash
    if (photoBasePath.endsWith('/')) {
      photoBasePath = photoBasePath.slice(0, -1);
    }

    const file = `${photoBasePath}/${filename}`;

    const imageExists = existsSync(file);
    if (!imageExists) {
      res.status(500).send('An error occurred while reading the image.');
      return;
    }

    const imageStream = createReadStream(file);
    res.setHeader('Content-Type', contentType);
    imageStream.on('open', () => {
      imageStream.pipe(res);
    });

    imageStream.on('error', () => {
      res.status(500).send('An error occurred while reading the image.');
    });
  }

  @Get('logo')
  getLogo(@Res() res: Response) {
    this.sendFile(res, 'postboy.svg', 'image/svg+xml');
  }

  @Get('henry')
  getHenry(@Res() res: Response) {
    this.sendFile(res, 'henry.png', 'image/png');
  }

  @Get('oauth')
  getOAuth(@Res() res: Response) {
    this.sendFile(res, 'oauth2.png', 'image/png');
  }
}
