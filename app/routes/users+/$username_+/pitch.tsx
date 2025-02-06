import { invariantResponse } from '@epic-web/invariant'
import MuxUploader from '@mux/mux-uploader-react'
import { createId } from '@paralleldrive/cuid2'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { muxClient } from '#app/utils/mux.server.ts'
// import { useOptionalUser } from '#app/utils/user.ts'

export async function loader({ params, request }: LoaderFunctionArgs) {
	await requireUserId(request)
	const user = await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			username: true,
			image: { select: { id: true } },
			notes: { select: { id: true, title: true } },
		},
		where: { username: params.username },
	})

	invariantResponse(user, 'Owner not found', { status: 404 })
	const id = createId()

	const upload = await muxClient.video.uploads.create({
		new_asset_settings: {
			passthrough: id,
			playback_policy: ['public'],
			video_quality: 'basic',
		},
		cors_origin: 'https://www.raywom.com',
	})

	//todo: save in database the id
	return json({ url: upload.url, user })
}

export default function PitchRoute() {
	const { url } = useLoaderData<typeof loader>()
	// const user = useOptionalUser()
	return (
		<main className="container flex h-full min-h-[400px] px-0 pb-12 md:px-8">
			<div>
				<MuxUploader endpoint={url} />
			</div>
		</main>
	)
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
