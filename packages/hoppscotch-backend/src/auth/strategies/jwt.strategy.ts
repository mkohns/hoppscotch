import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessTokenPayload } from 'src/types/AuthTokens';
import { UserService } from 'src/user/user.service';
// import { AuthService } from '../auth.service';
import { Request } from 'express';
import * as O from 'fp-ts/Option';
import {
  //  COOKIES_NOT_FOUND,
  INVALID_ACCESS_TOKEN,
  USER_NOT_FOUND,
} from 'src/errors';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private usersService: UserService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // console.log('entering jwtStrategy');
          if (request.baseUrl) {
            console.log('URL:', request.baseUrl);
          }
          const authCookie = this.extractJwtFromCookie(request);
          const authHeader = this.extractJwtFromAuthHeader(request);
          const accessHeader = this.extractJwtFromAccessHeader(request);
          const subscriptionsHeader = this.extractforSubscriptions(request);

          if (
            !authCookie &&
            !authHeader &&
            !accessHeader &&
            !subscriptionsHeader
          ) {
            console.log(
              'No Authorization found in cookie/authorization/access-token/subscriptions header!',
              request,
            );
            throw new ForbiddenException(INVALID_ACCESS_TOKEN);
          }

          return (
            authHeader || accessHeader || authCookie || subscriptionsHeader
          );
        },
      ]),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  extractforSubscriptions(request: any) {
    if (!request.authorization) {
      return undefined;
    }
    if (!request.authorization.startsWith('Bearer')) {
      return undefined;
    }
    console.log('Found token in subscriptions header');
    return request.authorization.split(' ')[1];
  }

  extractJwtFromCookie(request: Request) {
    if (!request.cookies) {
      return undefined;
    }
    if (!request.cookies['access_token']) {
      return undefined;
    }
    console.log('Found token in cookie');
    return request.cookies['access_token'];
  }

  extractJwtFromAuthHeader(request: Request) {
    if (!request.headers || !request.headers.authorization) {
      return undefined;
    }
    if (!request.headers.authorization.startsWith('Bearer')) {
      return undefined;
    }
    console.log('Found token in auth header');
    return request.headers.authorization.split(' ')[1];
  }

  extractJwtFromAccessHeader(request: Request) {
    if (!request.headers || !request.headers['access-token']) {
      return undefined;
    }
    console.log('Found token in access-token header');
    return request.headers['access-token'];
  }

  async validate(payload: AccessTokenPayload) {
    if (!payload) throw new ForbiddenException(INVALID_ACCESS_TOKEN);

    const user = await this.usersService.findUserById(payload.sub);
    if (O.isNone(user)) {
      throw new UnauthorizedException(USER_NOT_FOUND);
    }

    return user.value;
  }
}
