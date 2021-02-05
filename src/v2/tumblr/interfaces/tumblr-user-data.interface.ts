export interface TumblrAuthData {
  token: string;
  secret: string;
  user: {
    name: string;
    blogs: any[];
  };
}

export interface TumblrAccountData {
  name: string;
  blogs: any[];
}
