import { json } from '@remix-run/node'
import { type ActionFunctionArgs } from '@remix-run/node'
import { prisma } from '#app/utils/db.server.ts'
import { muxClient } from '#app/utils/mux.server.ts'

export const action = async ({ request }: ActionFunctionArgs) => {
	if (request.method !== 'POST') {
		return new Response('Method not allowed', { status: 405 })
	}

	const body = await request.text()
	// mux.webhooks.unwrap will validate that the given payload was sent by Mux and parse the payload.
	// It will also provide type-safe access to the payload.
	// Generate MUX_WEBHOOK_SIGNING_SECRET in the Mux dashboard
	// https://dashboard.mux.com/settings/webhooks
	const event = muxClient.webhooks.unwrap(
		body,
		request.headers,
		process.env.MUX_WEBHOOK_SIGNING_SECRET,
	)

	// you can also unwrap the payload yourself:
	// const event = await request.json();
	switch (event.type) {
		case 'video.upload.asset_created':
			// Update the database with the asset ID
			if (event.data.new_asset_settings?.passthrough) {
				const videoId = event.data.new_asset_settings.passthrough as string
				await prisma.userVideo.update({
					where: { id: videoId },
					data: {
						status: 'processing',
					},
				})
			}
			break
		case 'video.asset.ready':
			// Update the database with the playback ID when the video is ready
			if (
				event.data &&
				'passthrough' in event.data &&
				event.data.passthrough &&
				'playback_ids' in event.data &&
				event.data.playback_ids &&
				Array.isArray(event.data.playback_ids) &&
				event.data.playback_ids.length > 0 &&
				event.data.playback_ids[0] &&
				'id' in event.data.playback_ids[0]
			) {
				const videoId = event.data.passthrough as string
				const playbackId = event.data.playback_ids[0].id

				await prisma.userVideo.update({
					where: { id: videoId },
					data: {
						playbackId,
						status: 'ready',
					},
				})
			}
			break
		// there are many more Mux webhook events
		// check them out at https://www.mux.com/docs/webhook-reference
		default:
			break
	}

	return json({ message: 'ok' })
}
