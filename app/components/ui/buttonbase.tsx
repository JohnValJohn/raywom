import React from 'react'

//  interface Props
// 	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
// 		VariantProps<typeof buttonVariants> {
// 	asChild?: boolean
// }
export const ButtonBase = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ ...props }, ref) => {
	return (
		<button
			ref={ref}
			className="inline-flex items-center justify-center rounded-md text-sm font-medium outline-none ring-ring ring-offset-2 ring-offset-background transition-colors focus-within:ring-2 focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
			{...props}
		/>
	)
})
ButtonBase.displayName = 'ButtonBase'
