import React from "react";

const Button = ({
  children,
  variant = "default",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  className = "",
  type = "button",
  title = "",
  icon: Icon = null,
  iconPosition = "left",
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border min-h-10";
  
  const variants = {
    default: "border-input bg-background hover:bg-accent hover:text-accent-foreground",
    primary: "border-blue-500 bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "border-gray-500 bg-gray-600 hover:bg-gray-700 text-white",
    success: "border-green-500 bg-green-600 hover:bg-green-700 text-white",
    danger: "border-red-500 bg-red-600 hover:bg-red-700 text-white",
    warning: "border-orange-500 bg-orange-600 hover:bg-orange-700 text-white",
    ghost: "border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs h-8",
    md: "px-4 py-2 text-sm h-12",
    lg: "px-6 py-3 text-base h-14"
  };
  
  const variantClasses = variants[variant] || variants.default;
  const sizeClasses = sizes[size] || sizes.md;
  const classes = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`;
  
  // Build style object for theme integration and hover colors
  let buttonStyle = {};
  let originalBg = '';
  let originalColor = '';
  let originalBorder = '';
  let hoverBg = '';
  let hoverColor = '';
  let hoverBorder = '';
  
  if (variant === "default" || variant === "ghost") {
    // Set default colors from theme
    originalBg = props.style?.backgroundColor || 'var(--bg-secondary)';
    originalColor = props.style?.color || 'var(--text-primary)';
    originalBorder = props.style?.borderColor || 'var(--border-color)';
    
    // Set hover colors - allow custom override via style prop
    hoverBg = props.style?.['--hover-bg'] || 'var(--bg-accent)';
    hoverColor = props.style?.['--hover-color'] || 'var(--text-accent)';
    hoverBorder = props.style?.['--hover-border'] || 'var(--border-color)';
    
    buttonStyle = {
      borderColor: originalBorder,
      backgroundColor: originalBg,
      color: originalColor,
      ...(props.style || {})
    };
  } else if (props.style) {
    buttonStyle = props.style;
  }
  
  // Hover handlers for custom hover colors
  const handleMouseEnter = (e) => {
    if (!disabled && !loading && (variant === "default" || variant === "ghost")) {
      if (hoverBg) e.currentTarget.style.backgroundColor = hoverBg;
      if (hoverColor) e.currentTarget.style.color = hoverColor;
      if (hoverBorder) e.currentTarget.style.borderColor = hoverBorder;
    }
    if (props.onMouseEnter) props.onMouseEnter(e);
  };
  
  const handleMouseLeave = (e) => {
    if (!disabled && !loading && (variant === "default" || variant === "ghost")) {
      if (originalBg) e.currentTarget.style.backgroundColor = originalBg;
      if (originalColor) e.currentTarget.style.color = originalColor;
      if (originalBorder) e.currentTarget.style.borderColor = originalBorder;
    }
    if (props.onMouseLeave) props.onMouseLeave(e);
  };
  
  // Remove style and event handlers from props spread
  const { style, onMouseEnter, onMouseLeave, ...restProps } = props;
  
  return (
    <button
      type={type}
      className={classes}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      {...restProps}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && Icon && iconPosition === "left" && (
        React.isValidElement(Icon) 
          ? Icon 
          : <Icon className="mr-2 size-4" />
      )}
      {children}
      {!loading && Icon && iconPosition === "right" && (
        React.isValidElement(Icon) 
          ? Icon 
          : <Icon className="ml-2 size-4" />
      )}
    </button>
  );
};

export default Button; 