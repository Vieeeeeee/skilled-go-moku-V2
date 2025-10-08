import type { SkillId } from '../types';

class DialogueManager {
    private lines: readonly string[];
    private shuffledLines: string[];

    constructor(lines: readonly string[]) {
        this.lines = lines;
        this.shuffledLines = [];
        this.reshuffle();
    }

    private reshuffle() {
        this.shuffledLines = [...this.lines];
        // Fisher-Yates shuffle
        for (let i = this.shuffledLines.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledLines[i], this.shuffledLines[j]] = [this.shuffledLines[j], this.shuffledLines[i]];
        }
    }

    public getLine(): string {
        if (this.shuffledLines.length === 0) {
            if (this.lines.length === 0) return ""; // Handle empty initial list
            this.reshuffle();
        }
        return this.shuffledLines.pop()!;
    }
}


// --- Opening / Rule Explanation ---
const openingSequences: readonly (readonly string[])[] = [
    [
        "自我介绍一下，在下‘张技能五’，技能五子棋学校的校长。",
        "传统的五子棋，就是把五个子连成一条线，这样就赢了。",
        "而我们技能五子棋呢，就是在传统的五子棋当中，加入了技能。",
        "多说无益，不如这样，我来随机挑选一位得意门生（就是你），给你演示一番。"
    ]
];


export const getOpeningLines = (): string[] => {
    const index = Math.floor(Math.random() * openingSequences.length);
    return [...openingSequences[index]];
};


// --- Mid-Game / Normal Play ---
const midGameLines_Neutral = [
    "请。",
    "是你，子棋？",
    "你，是老王的学生？",
    "哼，有点意思。",
    "你的棋路，我已看穿。",
    "真正的技能，就在你的心里。"
];

const midGameLines_Taunt = [
    "就这点本事吗？",
    "你的棋，软弱无力！",
    "哈哈哈，正合我意！",
    "你已经输了，只是你还不知道而已。",
    "很快你就会明白，我们之间的差距。"
];

const midGameLines_Concern = [
    "嗯？这步棋……",
    "有点东西，但不多。",
    "你……是从哪里学来的招式？",
    "我……我情绪上有点儿……"  ,
    "难道说，你也是我们技能五子棋学校的？"
];


// --- System Messages / Narration ---
const systemMessages = [
    "“张技能五”摆出了一个非常刻板的惊讶姿势。",
    "棋盘上的气氛变得紧张起来。",
    "空气中弥漫着一股强大的能量。",
    "要爆了！",
    "super idol 的笑容，我没你的甜。",
    "真正的技能，就在你的心里。"
];

// --- About to Use Skill / Disadvantage ---
const preSkillLines = [
    "那么接下来，我要给你展示我的第一个技能了。",
    "你给我看好了！",
    "我有一招，可以很好地克制你这步棋。",
    "既然这样，别怪我不客气了！"
];


// --- Explaining Skills ---
const skillExplanations: Record<SkillId, string> = {
    'remove': "飞沙走石！顾名思义，就是把对手的棋子，直接扔进……什刹海！",
    'skip': "静如止水！顾名思义，就是凝结时间，冻结空气！",
    'overwhelm': "力拔山兮！顾名思义就是摔坏棋盘，直接获胜！",
    'swap': "两极反转！通过你的黑历史，让你丧失战斗力！",
    'tiaoChengLiShan': "调呈离山！顾名思义，就是调走张呈，离开山……东！",
    'qinNa': "擒拿！擒拿！擒 擒！又拿 拿！擒住天地之精华，拿得老师笑哈哈！",
    'cleaning': "我-是-保-洁！",
    'ultimate': "超越极限！积分暴涨999！"
};

export const getSkillExplanation = (skillId: SkillId): string => {
    return skillExplanations[skillId] || "此招只可意会，不可言传！";
};

// --- Late Game / Summarizing ---
const aiWinLines = [
    "你现在明白，五子棋的真谛了吗？",
    "如果下棋就是为了赢的话，那你和那些下棋的，有什么区别？",
    "你看，你下棋只为了赢，你的面相都变了。",
    "笑一个吧。",
    "孩子，你现在明白了吗？外练筋骨皮，练的是体魄。内练五子棋，练的是快乐！"
];

const playerWinLines = [
    "我参加过九年义务教育……",
    "我用你们的方式，我也能赢你!"
];

const drawLines = [
    "外练筋骨皮，内练五子棋。"
];

const postGameLines = [
    "你跟我们下一把，下一把，你就全都明白了。"
]

// --- Special Reactions / Triggered ---
export const specialReactionLines = {
    provoked: "你骂老人！",
    checkmatedUnusually: "你个畜生！",
    isAlsoSkilled: "你也是我们技能五子棋学校的？"
};

const playerSkillReaction_General_Lines = [
    "哼，雕虫小技。",
    "有点意思，但不多。",
    "这……这是……？",
    "你，到底是谁？"
];

const playerSkillReaction_FeiShaZouShi_Lines = [
    "我的棋子！",
    "你……你做了什么！",
    "可恶！"
];

const ultimateSkillLines = [
    "终极奥义！积分暴涨！",
    "这就是真正的力量！",
    "超越极限！无尽能量！",
    "天地之力，尽归我身！"
];

// Create and export managers to reduce repetition
export const midGameDialogue = new DialogueManager(midGameLines_Neutral);
export const tauntDialogue = new DialogueManager(midGameLines_Taunt);
export const concernDialogue = new DialogueManager(midGameLines_Concern);
export const systemMessageDialogue = new DialogueManager(systemMessages);
export const preSkillDialogue = new DialogueManager(preSkillLines);
export const aiWinDialogue = new DialogueManager(aiWinLines);
export const playerWinDialogue = new DialogueManager(playerWinLines);
export const drawDialogue = new DialogueManager(drawLines);
export const postGameDialogue = new DialogueManager(postGameLines);
export const playerSkillReaction_General = new DialogueManager(playerSkillReaction_General_Lines);
export const playerSkillReaction_FeiShaZouShi = new DialogueManager(playerSkillReaction_FeiShaZouShi_Lines);
export const ultimateSkillDialogue = new DialogueManager(ultimateSkillLines);