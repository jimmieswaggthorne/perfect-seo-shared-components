import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import * as Dialog from '@radix-ui/react-dialog';

export interface ModalProps {
  children: React.ReactNode;
  onClose: Function;
  open: boolean;
  className?: string;
  componentClassNames?: ModalClassNameProps;
  closeDelay?: number;
  onCloseTrigger?: () => void;
  closeIcon?: boolean
  id?: string,
  noClickout?: boolean,
  noKeyEscape?: boolean,
  custom?: boolean,
  animateClose?: boolean,
  theme?: ModalThemes;
  transparent?: boolean;
  onClick?: (any) => void;
  mobileAlignment?: 'start' | 'end' | 'center'
}

export interface ModalClassNameProps {
  overlay?: string,
  modal?: string,
}
export enum ModalThemes {
  'NORMAL' = 'normal',
  'BOTTOM' = 'bottom',
  'SHOWHEADER' = 'showHeader',
}

export const Overlay = (
  { children,
    onClose,
    open,
    className,
    componentClassNames,
    closeDelay = 500,
    closeIcon,
    noClickout,
    noKeyEscape,
    custom,
    transparent,
    animateClose = true,
    theme = ModalThemes.NORMAL,
    id,
    mobileAlignment,
    onClick,
    onCloseTrigger }: ModalProps) => {

  const [modalOpen, setModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const closeModal = () => {
    if (animateClose) {
      setClosing(true);
      if (onCloseTrigger) {
        onCloseTrigger();
      }
      setTimeout(() => {
        setClosing(false);
        setModalOpen(false);
        document.body.removeAttribute('style');
        return onClose();
      }, closeDelay);
    } else {
      setModalOpen(false);
      document.body.removeAttribute('style');
      return onClose();
    }
  };

  const clickout = (e) => {
    e.preventDefault();
    if (noClickout === true) {
      return;
    }
    closeModal();
    document.body.removeAttribute('style');
  };


  const escapeClick = (e) => {
    e.preventDefault();
    if (noKeyEscape) {
      return;
    }
    closeModal();
  };

  useEffect(() => {
    setModalOpen(open);
    if (open === false || open === null || !open) {
      document.body.removeAttribute('style');
    }
  }, [open]);

  const contentClasses = classNames('modal-content', {
    [`${className}`]: className,
    [`${componentClassNames?.modal}`]: componentClassNames?.modal,
    transparent: transparent,
    'closing': closing && animateClose,
    'animate': animateClose || custom,
    [`${theme?.toString()}`]: true,
  });

  const overlayClasses = classNames('modal-overlay', {
    [`${componentClassNames?.overlay}`]: componentClassNames?.overlay,
    [`${mobileAlignment}`]: mobileAlignment,
  });

  const openChange = (bool) => {
    if (bool) {
      setModalOpen(true);
    } else {
      closeModal();
    }
  };

  return (
    <Dialog.Root open={modalOpen} onOpenChange={openChange} modal>
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClasses} onClick={onClick}>
          <Dialog.Content aria-describedby={id || undefined} className={contentClasses} onInteractOutside={clickout} onPointerDownOutside={clickout} onEscapeKeyDown={escapeClick} id={id} title={id}>
            {closeIcon &&
              <button
                aria-label="close modal"
                className="modal-closeButton"
                onClick={e => {
                  e.preventDefault();
                  closeModal();
                }}
              >
                x
              </button>}
            {modalOpen && children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
};



interface ModalChildProps {
  children: React.ReactNode,
  className?: string,
}
interface ModalTitleProps {
  children?: React.ReactNode,
  className?: string,
  title: string
}

export const Title = ({ children, className, title }: ModalTitleProps) => {
  const modalTitleClasses = classNames('modal-heading', {
    [`${className}`]: className,
  });

  return (
    <>
      {children && <div id="modal-heading" className={modalTitleClasses}>{children}</div>}
      <Dialog.Title className='d-none'>{title}</Dialog.Title>
    </>
  );
};

export const Description = ({ children, className }: ModalChildProps) => {
  const modalDescriptionClasses = classNames('modal-description', {
    [`${className}`]: className,
  });

  return (
    <div id="modal-description" className={modalDescriptionClasses}>{children}</div>
  );
};

interface ModalHeadingProps {
  children: React.ReactNode,
  className?: string,
  Icon?: React.ReactElement<any> | number | string,
  backFunc?: () => void,
}

export const Footer = ({ children, className }: ModalChildProps) => {
  const modalFooterClasses = classNames('modal-footer', {
    [`${className}`]: className,
  });

  return (
    <div id="modal-footer" className={modalFooterClasses}>{children}</div>
  );
};

export const Icon = ({ children, className }: ModalChildProps) => {
  const modalIconClasses = classNames('icon', {
    [`${className}`]: className,
  });

  return (
    <div id="modal-icon" className={modalIconClasses}>{children}</div>
  );
};

export const ButtonBar = ({ children, className }: ModalChildProps) => {
  const modalIconClasses = classNames('modal-button-bar', {
    [`${className}`]: className,
  });

  return (
    <div className={modalIconClasses}>{children}</div>
  );
};

export const ButtonBarGroup = ({ children, className }: ModalChildProps) => {
  const modalIconClasses = classNames('modal-button-group', {
    [`${className}`]: className,
  });

  return (
    <div className={modalIconClasses}>{children}</div>
  );
};
