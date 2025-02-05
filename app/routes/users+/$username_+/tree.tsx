import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { prisma } from '#app/utils/db.server.ts'
// import { useOptionalUser } from '#app/utils/user.ts'

export async function loader({ params }: LoaderFunctionArgs) {
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

	return json({ user })
}

export default function TreeRoute() {
	// const data = useLoaderData<typeof loader>()
	// const user = useOptionalUser()
	return (
		<main className="container flex h-full min-h-[400px] px-0 pb-12 md:px-8">
			<div>Arbre de recommandations en construction</div>
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
