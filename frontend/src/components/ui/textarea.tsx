import { forwardRef, TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}
export const TextArea = forwardRef < HTMLTextAreaElement, TextAreaProps> (
    ({ label, error, ...props }, ref) => {
        return (
            <div>
                {label && <label>{label}</label>}
                <textarea ref={ref} {...props} />
                {error && <span>{error}</span>}
            </div>
        );
    }
);