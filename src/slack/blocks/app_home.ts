import { getPendingHourSubmissionData } from '~slack/blocks/admin/pending_requests'
import { getHourSubmissionBlocks } from '~slack/blocks/admin/hour_submission'
import { ActionIDs } from '~slack/handlers'
import { getUserHourSummaryBlocks } from '~slack/blocks/member/user_hours'
import { getUserCertBlocks } from '~slack/blocks/member/user_certs'
import { Blocks, Elements, HomeTab } from 'slack-block-builder'
import config from '~config'
import { getCertRequestBlocks } from '~slack/blocks/certify'
import prisma from '~lib/prisma'

export async function getAppHome(user_id: string) {
    const homeTab = HomeTab()
    if (config.slack.users.admins.includes(user_id)) {
        const pending_requests = await getPendingHourSubmissionData()
        const pending_certs = await prisma.memberCertRequest.findMany({ where: { state: 'pending' }, include: { Member: true, Cert: true, Requester: true } })

        homeTab.blocks(
            Blocks.Header().text('Pending Hour Submissions'),
            pending_requests.flatMap((req) => [...getHourSubmissionBlocks(req), Blocks.Divider()]),
            Blocks.Divider(),
            Blocks.Header().text('Pending Certification Requests'),
            pending_certs.flatMap((req) => [...getCertRequestBlocks(req).blocks, Blocks.Divider()]),

            Blocks.Context().elements('Last updated ' + new Date().toLocaleTimeString())
        )
    } else {
        homeTab.blocks(
            Blocks.Actions().elements(
                Elements.Button().text('Log Hours').actionId(ActionIDs.OPEN_LOG_MODAL),
                Elements.Button().text('Show Info').actionId(ActionIDs.OPEN_USERINFO_MODAL),
                Elements.Button().text('Send Pending Requests').actionId(ActionIDs.SEND_PENDING_REQUESTS)
            ),
            await getUserHourSummaryBlocks({ slack_id: user_id }),
            Blocks.Divider(),
            await getUserCertBlocks({ slack_id: user_id }),
            Blocks.Divider(),
            Blocks.Context().elements('Last updated ' + new Date().toLocaleTimeString())
        )
    }
    return homeTab.buildToObject()
}
