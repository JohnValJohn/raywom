import { Link } from '@remix-run/react'

export const HomeButton = () => {
	return (
		<Link to="/">
			<span className="">Accueil</span>
		</Link>
	)
}
