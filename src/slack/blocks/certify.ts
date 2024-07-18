import { Prisma } from '@prisma/client'
import { Bits, Blocks, Elements, Message, Modal, OptionGroupBuilder } from 'slack-block-builder'
import { ActionIDs, ViewIDs } from '~slack/handlers'
import prisma from '~lib/prisma'
import config from '~config'

export async function getCertifyModal(user: Prisma.MemberWhereUniqueInput) {
    const manager = await prisma.member.findUnique({
        where: user,
        select: {
            MemberCerts: {
                where: { Cert: { isManager: true } },
                select: {
                    Cert: {
                        select: {
                            id: true,
                            Department: { select: { name: true, id: true, Certs: { select: { id: true, label: true } } } }
                        }
                    }
                }
            }
        }
    })
    if (!manager) {
        return Modal().title(':(').blocks(Blocks.Header().text('No member found')).buildToObject()
    }
    const managedDepartments = manager.MemberCerts.map((c) => c.Cert.Department)
    if (managedDepartments.length == 0) {
        return Modal().title(':(').blocks(Blocks.Header().text('Must be a manager')).buildToObject()
    }

    const optionGroups: OptionGroupBuilder[] = managedDepartments
        .filter((d) => d != null)
        .map((d) => {
            return Bits.OptionGroup()
                .label(d.name)
                .options(d.Certs.map((c) => Bits.Option().text(c.label).value(c.id)))
        })

    return Modal()
        .title('Certify')
        .callbackId(ViewIDs.MODAL_CERTIFY)
        .blocks(
            Blocks.Input().label('Member(s)').blockId('users').element(Elements.UserMultiSelect().actionId('users').placeholder('Select the members to certify')),
            Blocks.Input()
                .label('Certification')
                .blockId('cert')
                .element(Elements.StaticSelect().actionId('cert').placeholder('Select the certification to give').optionGroups(optionGroups))
        )
        .submit('Submit')
        .close('Cancel')
        .buildToObject()
}

export function getCertRequestMessage(
    giving_member: { slack_id: null | string },
    r: { id: number; Member: { full_name: string; slack_id: string | null; slack_photo_small: string | null; fallback_photo: string | null } },
    cert: { label: string },
    state: 'pending' | 'approved' | 'rejected',
    ts?: string
) {
    const msg = Message().channel(config.slack.channels.certification_approval).ts(ts)

    let text: string
    let footer: string
    switch (state) {
        case 'approved':
            text = `Approved \`${cert.label}\` cert for <@${r.Member.slack_id}>`
            footer = '✅ Approved'
            break
        case 'rejected':
            text = `Rejected \`${cert.label}\` cert for <@${r.Member.slack_id}>`
            footer = '❌ Rejected'
            break
        default:
            text = `\`${cert.label}\` cert requested for <@${r.Member.slack_id}> by <@${giving_member.slack_id}>`
            footer = '⏳ Submitted'
    }
    msg.text(text)
    msg.blocks(Blocks.Section().text(text))

    if (state == 'pending') {
        msg.blocks(
            Blocks.Actions().elements(
                Elements.Button().primary().text('Approve').actionId(ActionIDs.CERT_APPROVE).value(r.id.toString()),
                Elements.Button().danger().text('Reject').actionId(ActionIDs.CERT_REJECT).value(r.id.toString())
            )
        )
    }
    msg.blocks(
        Blocks.Context().elements(
            Elements.Img()
                .altText(r.Member.full_name)
                .imageUrl(r.Member.slack_photo_small ?? r.Member.fallback_photo ?? ''),
            `${r.id} | ${footer} ${new Date().toLocaleString()}`
        ),
        Blocks.Divider()
    )

    return msg.buildToObject()
}
