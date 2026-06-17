import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  useEffect,
  forwardRef,
} from "react";
import { Button } from "./Button";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

const ModalOverlay = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  ),
);
ModalOverlay.displayName = "ModalOverlay";

const ModalContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative z-50 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl",
        className,
      )}
      {...props}
    />
  ),
);
ModalContent.displayName = "ModalContent";

const ModalHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mb-4 flex items-start justify-between", className)}
      {...props}
    />
  ),
);
ModalHeader.displayName = "ModalHeader";

const ModalTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-forest-900", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

const ModalDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("mt-1 text-sm text-forest-500", className)}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

const ModalFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mt-6 flex justify-end gap-3", className)}
      {...props}
    />
  ),
);
ModalFooter.displayName = "ModalFooter";

const ModalClose = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "rounded-lg p-1 text-forest-400 hover:bg-forest-100 hover:text-forest-700",
      className,
    )}
    onClick={onClick}
    {...props}
  >
    <X className="h-5 w-5" />
  </button>
));
ModalClose.displayName = "ModalClose";

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  ...props
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ModalOverlay onClick={onClose} {...props}>
      <ModalContent
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader>
          <div>
            {title && <ModalTitle>{title}</ModalTitle>}
            {description && <ModalDescription>{description}</ModalDescription>}
          </div>
          <ModalClose onClick={onClose} />
        </ModalHeader>
        {children}
      </ModalContent>
    </ModalOverlay>
  );
}

const ModalBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-forest-700", className)} {...props} />
  ),
);
ModalBody.displayName = "ModalBody";

export {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
  Button as ModalButton,
};
