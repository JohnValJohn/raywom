import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Link, useLoaderData, type MetaFunction } from '@remix-run/react'
import { useState } from 'react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { ButtonBase } from '#app/components/ui/buttonbase.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { useOptionalUser } from '#app/utils/user.ts'

export async function loader({ params }: LoaderFunctionArgs) {
	const user = await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			username: true,
			createdAt: true,
			image: { select: { id: true } },
		},
		where: {
			username: params.username,
		},
	})

	invariantResponse(user, 'User not found', { status: 404 })

	return json({ user, userJoinedDisplay: user.createdAt.toLocaleDateString() })
}

export default function ProfileRoute() {
	const data = useLoaderData<typeof loader>()
	const user = data.user
	const userDisplayName = user.name ?? user.username
	const loggedInUser = useOptionalUser()
	const isLoggedInUser = data.user.id === loggedInUser?.id
	const [isRecommending, setIsRecommending] = useState(false)
	const [isListening, setIsListening] = useState(false)

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center">
			<Spacer size="4xs" />

			<div className="container flex flex-col items-center rounded-3xl bg-muted p-12">
				<div className="relative w-52">
					<div className="absolute -top-40">
						<div className="relative">
							<img
								src={getUserImgSrc(data.user.image?.id)}
								alt={userDisplayName}
								className="h-52 w-52 rounded-full object-cover"
							/>
						</div>
					</div>
					<div className="absolute -bottom-12">
						<Button
							variant={isRecommending ? 'accent' : 'outline'}
							size="roundIcon"
							onClick={() => {
								setIsRecommending(!isRecommending)
							}}
						>
							<Icon name="mouth"></Icon>
						</Button>
					</div>
					<div className="absolute -bottom-12 right-0">
						<Button
							variant={isListening ? 'accent' : 'outline'}
							size="roundIcon"
							onClick={() => {
								setIsListening(!isListening)
							}}
						>
							<Icon name="ear"></Icon>
						</Button>
					</div>
				</div>

				<Spacer size="sm" />
				<div className="flex flex-col gap-8 md:grid md:grid-cols-[200px_1fr_200px] md:self-stretch">
					<div className="flex flex-col items-center md:order-2">
						<div className="flex flex-wrap items-center justify-center gap-4">
							<h1 className="text-center text-h2">{userDisplayName}</h1>
						</div>
						<div className="flex gap-2"></div>
						<p className="mt-2 text-center text-muted-foreground">
							Profil créé le {data.userJoinedDisplay}
						</p>
						{isLoggedInUser ? (
							<Form action="/logout" method="POST" className="mt-3">
								<Button type="submit" variant="link" size="pill">
									<Icon name="exit" className="scale-125 max-md:scale-150">
										Déconnexion
									</Icon>
								</Button>
							</Form>
						) : null}
						<div className="mt-4 flex gap-4 md:mt-10">
							{
								isLoggedInUser && (
									<>
										{/* <Button asChild>
									<Link to="notes" prefetch="intent">
										My notes
									</Link>
								</Button> */}
										<Button asChild>
											<Link to="/settings/profile" prefetch="intent">
												Modifier le profil
											</Link>
										</Button>
									</>
								)
								// : (
								// 	<Button asChild>
								// 		<Link to="notes" prefetch="intent">
								// 			{userDisplayName}'s notes
								// 		</Link>
								// 	</Button>
								// )
							}
						</div>
					</div>
					<div className="flex flex-col gap-2 md:order-1">
						<Link to={`/users/${user.username}/pitch`}>
							<span className="flex flex-col align-middle">
								<Icon name="video" className="text-body-2xl"></Icon>
								<span className="text-center">Pitch video</span>
							</span>
						</Link>
						<Link to={`/users/${user.username}/pitch`}>
							<span className="flex flex-col align-middle">
								<Icon name="bar-chart" className="text-body-2xl"></Icon>
								<span className="text-center">Pitch audio</span>
							</span>
						</Link>
						<Link to={`/users/${user.username}/gallery`}>
							<span className="flex flex-col align-middle">
								<Icon name="camera" className="text-body-2xl"></Icon>
								<span className="text-center">Gallerie</span>
							</span>
						</Link>
					</div>
					<div className="md:order-3">
						<Link to={`/users/${user.username}/tree`}>
							<span className="flex flex-col align-middle">
								<Icon
									name="recommendation-tree"
									className="text-body-2xl"
								></Icon>
								<span>Arbre de recommandations</span>
							</span>
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	const displayName = data?.user.name ?? params.username
	return [
		{ title: `${displayName} | Epic Notes` },
		{
			name: 'description',
			content: `Profile of ${displayName} on Epic Notes`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No user with the username "{params.username}" exists</p>
				),
			}}
		/>
	)
}
