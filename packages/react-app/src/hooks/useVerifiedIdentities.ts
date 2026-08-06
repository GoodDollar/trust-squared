import React, { useEffect, useState } from "react";

import { multicall } from '@wagmi/core'
import { config } from '../providers/reownProvider'
import { POOL_CONTRACT } from "@/env";
import { abi } from '../abis/TrustPool'

const poolContract = {
    address: POOL_CONTRACT,
    abi,
    functionName: 'members'
} as const

export const useVerifiedIdentities = (account: `0x${string}` | undefined) => {
    const [identities, setIdentities] = useState<{ [key: string]: boolean }>()
    useEffect(() => {
        if (!account)
            return
        multicall(config, {
            contracts: [
                {
                    ...poolContract,
                    args: [1, account]
                },
                {
                    ...poolContract,
                    args: [2, account]
                },
                {
                    ...poolContract,
                    args: [3, account]
                },
                {
                    ...poolContract,
                    args: [4, account]
                }

            ],
        }).then(result => {
            const ids = { GoodID: !!result[0].result, WorldID: !!result[1].result, NoundsDAO: !!result[2].result, BrightID: !!result[3].result }
            setIdentities(ids)
        }).catch(() => {
            setIdentities({ GoodID: false, WorldID: false, NoundsDAO: false, BrightID: false })
        })
    }, [account])

    return identities

}