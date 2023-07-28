export interface TumblrAuthData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  status: string;
  error_description?: any;
  user: {
    name: string;
    blogs: any[];
  };
}

export interface TumblrAccountData {
  name: string;
  blogs: any[];
}
