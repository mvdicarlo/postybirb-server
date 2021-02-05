export interface TwitterAuthDto {
  token: string;
  secret: string;
  pin: string;
}

export interface TwitterPostDto {
  status: string;
  medias?: MediaObject[];
  secret: string;
  token: string;
  sensitive: boolean;
}

export interface MediaObject {
  base64: string;
  type: string;
}
