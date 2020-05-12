import { IsDefined } from 'class-validator';
import { FileUpload } from '../interfaces/file-upload.interface';

export class SubmissionPost<T> {
  @IsDefined()
  secret: string;

  @IsDefined()
  token: string;

  @IsDefined()
  readonly options: T;

  readonly tags: string[];
  readonly description: string;
  readonly rating: string;
  readonly files: FileUpload[];
  readonly title: string;

  constructor() {
    this.files = [];
    this.tags = [];
    this.rating = 'general';
    this.title = '';
    this.description = '';
  }

  getFilesforPost() {
    return this.files.map(file => ({
      value: Buffer.from(file.data, 'base64'),
      options: {
        filename: file.filename,
        contentType: file.contentType,
      },
    }));
  }
}
