export const CollectionType = {
    NONE: 'none',
    WHITE_LIST: 'white_list', // allowList

    BUNDLE: 'bundle',   // 'things',
    EFFECT: 'effect',   // 'colors'
    TOKENS: 'tokens',   // 'achievements'

    // only for interact with contract
    enum: {
        EFFECT: 0,
        BUNDLE: 1,
        TOKENS: 3,
        NONE: 4
    },
    canApplyEffect(type){
        return [this.TOKENS].includes(type)
    },
    isBundle(type){
        return this.BUNDLE === type
    },
    getCollectionName(type){
        return (type === this.EFFECT)? 'Effects' : (type === this.BUNDLE)? 'Bundles' : 'Other'
    },
    getTypeByEnumNumber(number){
        const findType = Object.entries(this.enum).find(([_, n]) => n === number)
        if(!findType) return this.NONE
        return this[findType[0]]
    },
}