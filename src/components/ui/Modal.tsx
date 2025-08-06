import React, { ReactNode, useEffect } from 'react';

export interface ModalAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ModalAction[];
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions = [],
  size = 'medium',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = ''
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { maxWidth: '400px', width: '90%' };
      case 'medium':
        return { maxWidth: '600px', width: '90%' };
      case 'large':
        return { maxWidth: '800px', width: '95%' };
      case 'fullscreen':
        return { width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none' };
      default:
        return { maxWidth: '600px', width: '90%' };
    }
  };

  const getActionButtonStyle = (style?: string) => {
    const baseStyle = {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      transition: 'background-color 0.2s ease'
    };

    switch (style) {
      case 'primary':
        return { ...baseStyle, backgroundColor: '#3498db', color: '#fff' };
      case 'danger':
        return { ...baseStyle, backgroundColor: '#e74c3c', color: '#fff' };
      case 'success':
        return { ...baseStyle, backgroundColor: '#27ae60', color: '#fff' };
      case 'secondary':
      default:
        return { ...baseStyle, backgroundColor: '#6c757d', color: '#fff' };
    }
  };

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: size === 'fullscreen' ? 'stretch' : 'center',
        zIndex: 10000,
        padding: size === 'fullscreen' ? '0' : '20px'
      }}
      onClick={handleOverlayClick}
    >
      <div
        className={className}
        style={{
          backgroundColor: '#1e1e1e',
          borderRadius: size === 'fullscreen' ? '0' : '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: size === 'fullscreen' ? '100%' : '90vh',
          border: '2px solid #444',
          overflow: 'hidden',
          ...getSizeStyles()
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 20px 0 20px',
            borderBottom: title ? '1px solid #444' : 'none',
            paddingBottom: title ? '15px' : '0',
            marginBottom: title ? '20px' : '0'
          }}>
            {title && (
              <h2 style={{
                margin: 0,
                color: '#fff',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#aaa',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '5px',
                  marginLeft: 'auto',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#aaa'}
                title="Close (Esc)"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{
          flex: 1,
          padding: (title || showCloseButton) ? '0 20px' : '20px',
          overflowY: 'auto',
          color: '#fff'
        }}>
          {children}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div style={{
            padding: '20px',
            borderTop: '1px solid #444',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={action.disabled}
                style={{
                  ...getActionButtonStyle(action.style),
                  opacity: action.disabled ? 0.5 : 1,
                  cursor: action.disabled ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!action.disabled) {
                    const currentBg = e.currentTarget.style.backgroundColor;
                    e.currentTarget.style.backgroundColor = 
                      currentBg === 'rgb(52, 152, 219)' ? '#2980b9' :
                      currentBg === 'rgb(231, 76, 60)' ? '#c0392b' :
                      currentBg === 'rgb(39, 174, 96)' ? '#229954' :
                      '#5a6268';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!action.disabled) {
                    e.currentTarget.style.backgroundColor = 
                      action.style === 'primary' ? '#3498db' :
                      action.style === 'danger' ? '#e74c3c' :
                      action.style === 'success' ? '#27ae60' :
                      '#6c757d';
                  }
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Convenience components for common modal types

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'primary' | 'danger' | 'success';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'primary'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      actions={[
        { label: cancelText, action: onClose, style: 'secondary' },
        { label: confirmText, action: handleConfirm, style: confirmStyle }
      ]}
    >
      <p style={{ lineHeight: '1.5', margin: '0' }}>{message}</p>
    </Modal>
  );
};

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  closeText?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  closeText = 'OK'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      case 'info':
      default: return 'ℹ️';
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      case 'success': return 'Success';
      case 'info':
      default: return 'Information';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || getDefaultTitle()}
      size="small"
      actions={[
        { label: closeText, action: onClose, style: 'primary' }
      ]}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontSize: '2rem' }}>{getIcon()}</span>
        <p style={{ lineHeight: '1.5', margin: '0' }}>{message}</p>
      </div>
    </Modal>
  );
};

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  inputType?: 'text' | 'password' | 'number';
  required?: boolean;
}

export const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Input Required',
  label,
  placeholder = '',
  defaultValue = '',
  confirmText = 'OK',
  cancelText = 'Cancel',
  inputType = 'text',
  required = false
}) => {
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, isOpen]);

  const handleSubmit = () => {
    if (required && !value.trim()) return;
    onSubmit(value);
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      actions={[
        { label: cancelText, action: onClose, style: 'secondary' },
        { 
          label: confirmText, 
          action: handleSubmit, 
          style: 'primary',
          disabled: required && !value.trim()
        }
      ]}
    >
      <div>
        {label && (
          <label style={{ 
            display: 'block', 
            marginBottom: '10px', 
            color: '#fff',
            fontWeight: 'bold'
          }}>
            {label}
            {required && <span style={{ color: '#e74c3c' }}> *</span>}
          </label>
        )}
        <input
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          autoFocus
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '1rem',
            border: '1px solid #555',
            borderRadius: '4px',
            backgroundColor: '#333',
            color: '#fff',
            outline: 'none'
          }}
        />
      </div>
    </Modal>
  );
};

export default Modal;