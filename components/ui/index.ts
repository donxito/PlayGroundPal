/**
 * UI Components Index
 *
 * Centralized exports for all UI components
 */

export { Button } from "./Button";
export { Input } from "./Input";
export { LoadingSpinner } from "./LoadingSpinner";
export { Modal, ConfirmModal } from "./Modal";
export { RatingSelector } from "./RatingSelector";
export { PhotoGallery } from "./PhotoGallery";
export {
  OptimizedImage,
  ThumbnailImage,
  FullSizeImage,
} from "./OptimizedImage";
export {
  Skeleton,
  PlaygroundCardSkeleton,
  PhotoGallerySkeleton,
  FormSkeleton,
  ListSkeleton,
} from "./Skeleton";

// Re-export default exports for convenience
export { default as ButtonDefault } from "./Button";
export { default as InputDefault } from "./Input";
export { default as LoadingSpinnerDefault } from "./LoadingSpinner";
export { default as ModalDefault } from "./Modal";
export { default as RatingSelectorDefault } from "./RatingSelector";
export { default as PhotoGalleryDefault } from "./PhotoGallery";
