/* eslint-disable no-unused-vars */
export interface ImageMetadata {
  height: number;
  width: number;
}

export interface ImageProps {
  filename: string;
  idx: number;
  meta: ImageMetadata;
}

export interface SharedModalProps {
  index: number;
  images?: ImageProps[];
  currentPhoto?: ImageProps;
  changePhotoIdx: (newVal: number) => void;
  closeModal: () => void;
  navigation: boolean;
  direction?: number;
}
