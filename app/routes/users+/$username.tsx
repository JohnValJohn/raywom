import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import MuxPlayer from '@mux/mux-player-react'
import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import {
	Form,
	Link,
	useLoaderData,
	type MetaFunction,
	useActionData,
} from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { useOptionalUser } from '#app/utils/user.ts'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const currentUserId = await requireUserId(request)
	const user = await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			username: true,
			createdAt: true,
			image: { select: { id: true } },
			video: {
				select: {
					id: true,
					playbackId: true,
					status: true,
				},
			},
		},
		where: {
			username: params.username,
		},
	})

	invariantResponse(user, 'User not found', { status: 404 })

	// Check if the current user is recommending the profile user
	const recommendation = await prisma.userRecommendation.findUnique({
		where: {
			recommenderId_recommendedId: {
				recommenderId: currentUserId,
				recommendedId: user.id,
			},
		},
		select: { id: true },
	})

	// Check if the current user is listening to the profile user
	const listening = await prisma.userListening.findUnique({
		where: {
			listenerId_listenedToId: {
				listenerId: currentUserId,
				listenedToId: user.id,
			},
		},
		select: { id: true },
	})

	return json({
		user,
		userJoinedDisplay: user.createdAt.toLocaleDateString(),
		currentUserId,
		isRecommending: Boolean(recommendation),
		isListening: Boolean(listening),
	})
}

export async function action({ params, request }: ActionFunctionArgs) {
	const currentUserId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	const user = await prisma.user.findFirst({
		select: { id: true },
		where: { username: params.username },
	})

	invariantResponse(user, 'User not found', { status: 404 })

	// Don't allow users to recommend or listen to themselves
	if (currentUserId === user.id) {
		return json(
			{
				error: 'You cannot recommend or listen to yourself',
				isRecommending: null,
				isListening: null,
			},
			{ status: 400 },
		)
	}

	if (intent === 'toggle-recommendation') {
		const existingRecommendation = await prisma.userRecommendation.findUnique({
			where: {
				recommenderId_recommendedId: {
					recommenderId: currentUserId,
					recommendedId: user.id,
				},
			},
		})

		if (existingRecommendation) {
			// Remove recommendation
			await prisma.userRecommendation.delete({
				where: { id: existingRecommendation.id },
			})
			return json({ isRecommending: false, isListening: null })
		} else {
			// Add recommendation
			await prisma.userRecommendation.create({
				data: {
					recommenderId: currentUserId,
					recommendedId: user.id,
				},
			})
			return json({ isRecommending: true, isListening: null })
		}
	}

	if (intent === 'toggle-listening') {
		const existingListening = await prisma.userListening.findUnique({
			where: {
				listenerId_listenedToId: {
					listenerId: currentUserId,
					listenedToId: user.id,
				},
			},
		})

		if (existingListening) {
			// Remove listening
			await prisma.userListening.delete({
				where: { id: existingListening.id },
			})
			return json({ isListening: false, isRecommending: null })
		} else {
			// Add listening
			await prisma.userListening.create({
				data: {
					listenerId: currentUserId,
					listenedToId: user.id,
				},
			})
			return json({ isRecommending: null, isListening: true })
		}
	}

	return json(
		{ error: 'Invalid intent', isRecommending: null, isListening: null },
		{ status: 400 },
	)
}

const UserInteractionSchema = z.object({
	intent: z.enum(['toggle-recommendation', 'toggle-listening']),
})

export default function ProfileRoute() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const { user, currentUserId, userJoinedDisplay } = data
	const userDisplayName = user.name ?? user.username
	const loggedInUser = useOptionalUser()
	const isLoggedInUser = data.user.id === loggedInUser?.id

	// Use the latest state from the action response or fall back to the loader data
	const isRecommending =
		actionData?.isRecommending !== undefined
			? actionData.isRecommending
			: data.isRecommending

	const isListening =
		actionData?.isListening !== undefined
			? actionData.isListening
			: data.isListening

	const [recommendForm] = useForm({
		id: 'recommend-form',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: UserInteractionSchema })
		},
	})

	const [listenForm] = useForm({
		id: 'listen-form',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: UserInteractionSchema })
		},
	})

	const hasVideo = user.video?.status === 'ready' && user.video?.playbackId

	// Don't show recommendation/listening buttons for own profile
	const showInteractionButtons = !isLoggedInUser

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
					{showInteractionButtons && (
						<>
							<div className="absolute -bottom-12">
								<Form method="post" {...getFormProps(recommendForm)}>
									<input
										type="hidden"
										name="intent"
										value="toggle-recommendation"
									/>
									<Button
										variant={isRecommending ? 'accent' : 'outline'}
										size="roundIcon"
										type="submit"
									>
										<Icon name="mouth"></Icon>
									</Button>
								</Form>
							</div>
							<div className="absolute -bottom-12 right-0">
								<Form method="post" {...getFormProps(listenForm)}>
									<input type="hidden" name="intent" value="toggle-listening" />
									<Button
										variant={isListening ? 'accent' : 'outline'}
										size="roundIcon"
										type="submit"
									>
										<Icon name="ear"></Icon>
									</Button>
								</Form>
							</div>
						</>
					)}
				</div>

				<Spacer size="sm" />
				<div className="flex flex-col gap-8 md:grid md:grid-cols-[200px_1fr_200px] md:self-stretch">
					<div className="flex flex-col items-center md:order-2">
						<div className="flex flex-wrap items-center justify-center gap-4">
							<h1 className="text-center text-h2">{userDisplayName}</h1>
						</div>
						<div className="flex gap-2"></div>
						<p className="mt-2 text-center text-muted-foreground">
							Profil créé le {userJoinedDisplay}
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
							{isLoggedInUser && (
								<>
									<Button asChild>
										<Link to="/settings/profile" prefetch="intent">
											Modifier le profil
										</Link>
									</Button>
								</>
							)}
						</div>

						{hasVideo && (
							<div className="mt-6 w-full max-w-md">
								<h2 className="mb-2 text-center text-lg font-semibold">
									Ma vidéo
								</h2>
								<MuxPlayer
									playbackId={user.video?.playbackId || ''}
									metadata={{
										video_title: `${userDisplayName}'s Video`,
										video_id: user.video?.id || '',
										viewer_user_id: currentUserId,
									}}
									className="w-full rounded-md"
									autoPlay
								/>
							</div>
						)}
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
