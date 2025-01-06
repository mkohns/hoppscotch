import { Strategy } from 'passport-microsoft';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from 'src/user/user.service';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { createWriteStream } from 'fs';
@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private usersService: UserService,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    super({
      clientID: configService.get('INFRA.MICROSOFT_CLIENT_ID'),
      clientSecret: configService.get('INFRA.MICROSOFT_CLIENT_SECRET'),
      callbackURL: configService.get('INFRA.MICROSOFT_CALLBACK_URL'),
      scope: configService.get('INFRA.MICROSOFT_SCOPE').split(','),
      tenant: configService.get('INFRA.MICROSOFT_TENANT'),
      store: true,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile, done) {
    //console.log('MicrosoftStrategy -> validate -> profile', profile);
    //console.log('accessToken', accessToken);
    //console.log('refreshToken', refreshToken);
    const user = await this.usersService.findUserByEmail(
      profile.emails[0].value,
    );

    console.log('MicrosoftStrategy -> validate -> user', user);

    if (O.isNone(user)) {
      const createdUser = await this.usersService.createUserSSO(
        accessToken,
        refreshToken,
        profile,
      );

      // Download the users photo from azure AD
      // URL is: https://graph.microsoft.com/v1.0/me/photo/$value
      // using the accessToken as JWT Bearer Token
      // and save it to ./images/{user.uid}.jpg
      const photoPath = await this.getUserPhoto(accessToken, createdUser.uid);
      if (photoPath) {
        profile.photos = [];
        profile.photos.push({ value: 'photo/me' });
        const updatedUser = await this.usersService.updateUserDetails(
          createdUser,
          profile,
        );
        if (E.isLeft(updatedUser)) {
          throw new UnauthorizedException(updatedUser.left);
        }
      }

      return createdUser;
    }

    /**
     * * displayName and photoURL maybe null if user logged-in via magic-link before SSO
     */
    if (!user.value.displayName || !user.value.photoURL) {
      // update photo
      const photoPath = await this.getUserPhoto(accessToken, user.value.uid);
      if (photoPath) {
        profile.photos = [];
        profile.photos.push({ value: 'photo/me' });
      }
      const updatedUser = await this.usersService.updateUserDetails(
        user.value,
        profile,
      );
      if (E.isLeft(updatedUser)) {
        throw new UnauthorizedException(updatedUser.left);
      }
    }

    /**
     * * Check to see if entry for Microsoft is present in the Account table for user
     * * If user was created with another provider findUserByEmail may return true
     */
    const providerAccountExists =
      await this.authService.checkIfProviderAccountExists(user.value, profile);

    if (O.isNone(providerAccountExists))
      await this.usersService.createProviderAccount(
        user.value,
        accessToken,
        refreshToken,
        profile,
      );

    return user.value;
  }
  async getUserPhoto(
    accessToken: string,
    userUid: string,
  ): Promise<string | null> {
    // Download the user's photo from Azure AD
    let photoBasePath = this.configService.get('PHOTO_BASE_PATH');
    // remove trailing slash
    if (photoBasePath.endsWith('/')) {
      photoBasePath = photoBasePath.slice(0, -1);
    }
    const photoUrl = 'https://graph.microsoft.com/v1.0/me/photo/$value';
    const photoPath = `${photoBasePath}/${userUid}.jpg`;

    try {
      console.log("Trying to download user's photo from Azure AD: ", photoUrl);
      const response = await lastValueFrom(
        this.httpService.get(photoUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: 'stream',
        }),
      );

      const writer = createWriteStream(photoPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log('User photo downloaded successfully');
          resolve(photoPath);
        });

        writer.on('error', (err) => {
          console.error('Error downloading user photo:', err);
          reject(null);
        });
      });
    } catch (error) {
      console.error('Error fetching user photo from Azure AD:', error);
      return null;
    }
  }
}
