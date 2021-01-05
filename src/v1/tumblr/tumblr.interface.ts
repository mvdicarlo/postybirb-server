export interface TumblrAuthDto {
  oauth_token: string;
  secret: string;
  oauth_verifier: string;
}

export interface TumblrPostDto {
  title: string;
  description: string;
  medias?: FileObject[];
  tags: string;
  blog: string;
  type: string;
  token: string;
  secret: string;
}

export interface FileObject {
  base64: string;
  fileInfo: {
    type: string;
    name: string;
  }
}
