import React from "react";
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Button } from "./Button";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  animationType?: "none" | "slide" | "fade";
  transparent?: boolean;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  overlayClassName?: string;
  testID?: string;
}

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
  testID?: string;
}

/**
 * Modal component for confirmations and forms
 *
 * @param visible Whether the modal is visible
 * @param onClose Function called when modal should close
 * @param title Optional title for the modal
 * @param children Content to display in the modal
 * @param showCloseButton Whether to show close button in header
 * @param closeOnBackdrop Whether tapping backdrop closes modal
 * @param animationType Animation type for modal
 * @param transparent Whether modal background is transparent
 * @param className Additional classes for modal container
 * @param contentClassName Additional classes for content area
 * @param titleClassName Additional classes for title
 * @param overlayClassName Additional classes for overlay
 * @param testID Test identifier
 */
export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  animationType = "fade",
  transparent = true,
  className = "",
  contentClassName = "",
  titleClassName = "",
  overlayClassName = "",
  testID,
}) => {
  // Overlay classes
  const overlayClasses = `flex-1 bg-black/50 justify-center items-center px-4 ${overlayClassName}`;

  // Container classes
  const containerClasses = `bg-white rounded-lg max-w-md w-full max-h-[80%] ${className}`;

  // Content classes
  const contentClasses = `flex-1 ${contentClassName}`;

  // Title classes
  const titleClasses = `text-lg font-semibold text-gray-900 ${titleClassName}`;

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      animationType={animationType}
      transparent={transparent}
      onRequestClose={onClose}
      testID={testID}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View className={overlayClasses}>
          <TouchableWithoutFeedback>
            <View className={containerClasses}>
              {/* Header */}
              {(title || showCloseButton) && (
                <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                  {title && <Text className={titleClasses}>{title}</Text>}
                  {showCloseButton && (
                    <TouchableOpacity
                      onPress={onClose}
                      className="p-1"
                      accessibilityLabel="Close modal"
                      testID={testID ? `${testID}-close` : "modal-close"}
                    >
                      <Text className="text-gray-500 text-xl">×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Content */}
              <View className={contentClasses}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

/**
 * ConfirmModal component for confirmation dialogs
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  testID,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      showCloseButton={false}
      testID={testID}
    >
      <View className="p-4">
        <Text className="text-gray-700 text-base mb-6">{message}</Text>

        <View className="flex-row justify-end space-x-3">
          <Button
            title={cancelText}
            variant="outline"
            onPress={onClose}
            className="flex-1 mr-3"
            testID={testID ? `${testID}-cancel` : "confirm-modal-cancel"}
          />
          <Button
            title={confirmText}
            variant={confirmVariant}
            onPress={handleConfirm}
            className="flex-1"
            testID={testID ? `${testID}-confirm` : "confirm-modal-confirm"}
          />
        </View>
      </View>
    </Modal>
  );
};

export default Modal;
