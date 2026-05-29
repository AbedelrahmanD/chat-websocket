<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Smile, User, Heart, Leaf, Utensils, Trophy, Lightbulb, Search } from '@lucide/vue';

const emit = defineEmits<{
    (e: 'select', emoji: string): void;
    (e: 'close'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const searchQuery = ref('');
const activeCategoryName = ref('smileys');

const categoryIcons = {
    smileys: Smile,
    people: User,
    hearts: Heart,
    nature: Leaf,
    food: Utensils,
    activities: Trophy,
    objects: Lightbulb
};

const emojiCategories = [
    {
        name: 'smileys',
        label: 'Smileys',
        emojis: [
            { char: '😀', name: 'grinning face' },
            { char: '😃', name: 'grinning face with big eyes' },
            { char: '😄', name: 'grinning face with smiling eyes' },
            { char: '😁', name: 'beaming face with smiling eyes' },
            { char: '😆', name: 'grinning squinting face' },
            { char: '😅', name: 'grinning face with sweat' },
            { char: '😂', name: 'face with tears of joy' },
            { char: '🤣', name: 'rolling on the floor laughing' },
            { char: '😊', name: 'smiling face with smiling eyes' },
            { char: '😇', name: 'smiling face with halo' },
            { char: '🙂', name: 'slightly smiling face' },
            { char: '🙃', name: 'upside-down face' },
            { char: '😉', name: 'winking face' },
            { char: '😌', name: 'relieved face' },
            { char: '😍', name: 'smiling face with heart-eyes' },
            { char: '🥰', name: 'smiling face with hearts' },
            { char: '😘', name: 'face blowing a kiss' },
            { char: '😗', name: 'kissing face' },
            { char: '😋', name: 'face savoring food' },
            { char: '😛', name: 'face with tongue' },
            { char: '😜', name: 'winking face with tongue' },
            { char: '🤪', name: 'zany face' },
            { char: '😝', name: 'squinting face with tongue' },
            { char: '🤑', name: 'money-mouth face' },
            { char: '🤗', name: 'hugging face' },
            { char: '🤭', name: 'face with hand over mouth' },
            { char: '🤫', name: 'shushing face' },
            { char: '🤔', name: 'thinking face' },
            { char: '🤐', name: 'zipper-mouth face' },
            { char: '🤨', name: 'face with raised eyebrow' },
            { char: '😐', name: 'neutral face' },
            { char: '😑', name: 'expressionless face' },
            { char: '😶', name: 'face without mouth' },
            { char: '😏', name: 'smirking face' },
            { char: '😒', name: 'unamused face' },
            { char: '🙄', name: 'face with rolling eyes' },
            { char: '😬', name: 'grimacing face' },
            { char: '🤥', name: 'lying face' },
            { char: '😴', name: 'sleeping face' },
            { char: '😷', name: 'face with medical mask' },
            { char: '🤒', name: 'face with thermometer' },
            { char: '🤕', name: 'face with head-bandage' },
            { char: '🤢', name: 'nauseated face' },
            { char: '🤮', name: 'face vomiting' },
            { char: '🤧', name: 'sneezing face' },
            { char: '🥵', name: 'hot face' },
            { char: '🥶', name: 'cold face' },
            { char: '🥴', name: 'woozy face' },
            { char: '😵', name: 'dizzy face' },
            { char: '🤯', name: 'exploding head' },
            { char: '🤠', name: 'cowboy hat face' },
            { char: '🥳', name: 'partying face' },
            { char: '😎', name: 'smiling face with sunglasses' },
            { char: '🤓', name: 'nerd face' },
            { char: '🧐', name: 'face with monocle' },
            { char: '😕', name: 'confused face' },
            { char: '😟', name: 'worried face' },
            { char: '🙁', name: 'slightly frowning face' },
            { char: '😮', name: 'face with open mouth' },
            { char: '😯', name: 'hushed face' },
            { char: '😲', name: 'astonished face' },
            { char: '😳', name: 'flushed face' },
            { char: '🥺', name: 'pleading face' },
            { char: '😦', name: 'frowning face with open mouth' },
            { char: '😧', name: 'anguished face' },
            { char: '😨', name: 'fearful face' },
            { char: '😰', name: 'anxious face with sweat' },
            { char: '😥', name: 'sad but relieved face' },
            { char: '😢', name: 'crying face' },
            { char: '😭', name: 'loudly crying face' },
            { char: '😱', name: 'face screaming in fear' },
            { char: '😖', name: 'confounded face' },
            { char: '😣', name: 'persevering face' },
            { char: '😞', name: 'disappointed face' },
            { char: '😓', name: 'downcast face with sweat' },
            { char: '😩', name: 'weary face' },
            { char: '😫', name: 'tired face' },
            { char: '🥱', name: 'yawning face' },
            { char: '😤', name: 'face with steam from nose' },
            { char: '😡', name: 'pouting face' },
            { char: '😠', name: 'angry face' },
            { char: '🤬', name: 'face with symbols on mouth' },
            { char: '😈', name: 'smiling face with horns' },
            { char: '👿', name: 'angry face with horns' },
            { char: '💀', name: 'skull' },
            { char: '💩', name: 'pile of poo' },
            { char: '🤡', name: 'clown face' },
            { char: '👻', name: 'ghost' },
            { char: '👽', name: 'alien' },
            { char: '👾', name: 'alien monster' },
            { char: '🤖', name: 'robot' }
        ]
    },
    {
        name: 'people',
        label: 'Gestures',
        emojis: [
            { char: '👋', name: 'waving hand' },
            { char: '🤚', name: 'raised back of hand' },
            { char: '🖐️', name: 'hand with fingers splayed' },
            { char: '✋', name: 'raised hand' },
            { char: '🖖', name: 'vulcan salute' },
            { char: '👌', name: 'ok hand' },
            { char: '🤌', name: 'pinched fingers' },
            { char: '🤏', name: 'pinching hand' },
            { char: '✌️', name: 'victory hand' },
            { char: '🤞', name: 'crossed fingers' },
            { char: '🤟', name: 'love-you gesture' },
            { char: '🤘', name: 'sign of the horns' },
            { char: '🤙', name: 'call me hand' },
            { char: '👈', name: 'backhand index pointing left' },
            { char: '👉', name: 'backhand index pointing right' },
            { char: '👆', name: 'backhand index pointing up' },
            { char: '🖕', name: 'middle finger' },
            { char: '👇', name: 'backhand index pointing down' },
            { char: '☝️', name: 'index pointing up' },
            { char: '👍', name: 'thumbs up' },
            { char: '👎', name: 'thumbs down' },
            { char: '✊', name: 'raised fist' },
            { char: '👊', name: 'oncoming fist' },
            { char: '🤛', name: 'left-facing fist' },
            { char: '🤜', name: 'right-facing fist' },
            { char: '👏', name: 'clapping hands' },
            { char: '🙌', name: 'raising hands' },
            { char: '👐', name: 'open hands' },
            { char: '🤲', name: 'palms up together' },
            { char: '🤝', name: 'handshake' },
            { char: '🙏', name: 'folded hands' },
            { char: '✍️', name: 'writing hand' },
            { char: '💅', name: 'nail polish' },
            { char: '🤳', name: 'selfie' },
            { char: '💪', name: 'flexed biceps' },
            { char: '🧠', name: 'brain' },
            { char: '👀', name: 'eyes' },
            { char: '👤', name: 'bust in silhouette' }
        ]
    },
    {
        name: 'hearts',
        label: 'Hearts',
        emojis: [
            { char: '❤️', name: 'red heart' },
            { char: '🧡', name: 'orange heart' },
            { char: '💛', name: 'yellow heart' },
            { char: '💚', name: 'green heart' },
            { char: '💙', name: 'blue heart' },
            { char: '💜', name: 'purple heart' },
            { char: '🖤', name: 'black heart' },
            { char: '🤍', name: 'white heart' },
            { char: '🤎', name: 'brown heart' },
            { char: '💔', name: 'broken heart' },
            { char: '❣️', name: 'heart exclamation' },
            { char: '💕', name: 'two hearts' },
            { char: '💞', name: 'revolving hearts' },
            { char: '💓', name: 'beating heart' },
            { char: '💗', name: 'growing heart' },
            { char: '💖', name: 'sparkling heart' },
            { char: '💘', name: 'heart with arrow' },
            { char: '💝', name: 'heart with ribbon' },
            { char: '💟', name: 'heart decoration' },
            { char: '🔥', name: 'fire' },
            { char: '✨', name: 'sparkles' },
            { char: '🌟', name: 'glowing star' },
            { char: '⭐', name: 'star' },
            { char: '💥', name: 'collision' },
            { char: '💯', name: 'hundred points' },
            { char: '🎉', name: 'party popper' },
            { char: '🎊', name: 'confetti ball' }
        ]
    },
    {
        name: 'nature',
        label: 'Nature',
        emojis: [
            { char: '🐶', name: 'dog face' },
            { char: '🐱', name: 'cat face' },
            { char: '🐭', name: 'mouse face' },
            { char: '🐹', name: 'hamster face' },
            { char: '🐰', name: 'rabbit face' },
            { char: '🦊', name: 'fox face' },
            { char: '🐻', name: 'bear face' },
            { char: '🐼', name: 'panda face' },
            { char: '🐨', name: 'koala' },
            { char: '🐯', name: 'tiger face' },
            { char: '🦁', name: 'lion face' },
            { char: '🐮', name: 'cow face' },
            { char: '🐷', name: 'pig face' },
            { char: '🐵', name: 'monkey face' },
            { char: '🐔', name: 'chicken' },
            { char: '🐧', name: 'penguin' },
            { char: '🦆', name: 'duck' },
            { char: '🦅', name: 'eagle' },
            { char: '🦉', name: 'owl' },
            { char: '🐸', name: 'frog' },
            { char: '🐊', name: 'crocodile' },
            { char: '🐢', name: 'turtle' },
            { char: '🐍', name: 'snake' },
            { char: '🐉', name: 'dragon' },
            { char: '🐙', name: 'octopus' },
            { char: '🐝', name: 'honeybee' },
            { char: '🐛', name: 'bug' },
            { char: '🦋', name: 'butterfly' },
            { char: '🌸', name: 'cherry blossom' },
            { char: '🌹', name: 'rose' },
            { char: '🌺', name: 'hibiscus' },
            { char: '🌻', name: 'sunflower' },
            { char: '🌱', name: 'seedling' },
            { char: '🌲', name: 'evergreen tree' },
            { char: '🌳', name: 'deciduous tree' },
            { char: '🌴', name: 'palm tree' },
            { char: '🌵', name: 'cactus' },
            { char: '🌿', name: 'herb' },
            { char: '🍀', name: 'four leaf clover' },
            { char: '🍁', name: 'maple leaf' },
            { char: '🍂', name: 'fallen leaf' }
        ]
    },
    {
        name: 'food',
        label: 'Food',
        emojis: [
            { char: '🍏', name: 'green apple' },
            { char: '🍎', name: 'red apple' },
            { char: '🍐', name: 'pear' },
            { char: '🍊', name: 'tangerine' },
            { char: '🍋', name: 'lemon' },
            { char: '🍌', name: 'banana' },
            { char: '🍉', name: 'watermelon' },
            { char: '🍇', name: 'grapes' },
            { char: '🍓', name: 'strawberry' },
            { char: '🍒', name: 'cherries' },
            { char: '🍑', name: 'peach' },
            { char: '🍍', name: 'pineapple' },
            { char: '🥝', name: 'kiwi fruit' },
            { char: '🍅', name: 'tomato' },
            { char: '🥑', name: 'avocado' },
            { char: '🍆', name: 'eggplant' },
            { char: '🥔', name: 'potato' },
            { char: '🥕', name: 'carrot' },
            { char: '🌽', name: 'ear of corn' },
            { char: '🌶️', name: 'hot pepper' },
            { char: '🍄', name: 'mushroom' },
            { char: '🥜', name: 'peanuts' },
            { char: '🍞', name: 'bread' },
            { char: '🥐', name: 'croissant' },
            { char: '🥖', name: 'baguette bread' },
            { char: '🥨', name: 'pretzel' },
            { char: '🧀', name: 'cheese wedge' },
            { char: '🍖', name: 'meat on bone' },
            { char: '🍗', name: 'poultry leg' },
            { char: '🥩', name: 'cut of meat' },
            { char: '🥓', name: 'bacon' },
            { char: '🍔', name: 'hamburger' },
            { char: '🍟', name: 'french fries' },
            { char: '🍕', name: 'pizza' },
            { char: '🌭', name: 'hot dog' },
            { char: '🥪', name: 'sandwich' },
            { char: '🌮', name: 'taco' },
            { char: '🌯', name: 'burrito' },
            { char: '🍳', name: 'cooking' },
            { char: '🍲', name: 'pot of food' },
            { char: '🥣', name: 'bowl with spoon' },
            { char: '🥗', name: 'green salad' },
            { char: '🍿', name: 'popcorn' },
            { char: '🍣', name: 'sushi' },
            { char: '🍦', name: 'soft ice cream' },
            { char: '🍩', name: 'donut' },
            { char: '🍪', name: 'cookie' },
            { char: '🎂', name: 'birthday cake' },
            { char: '🍫', name: 'chocolate bar' },
            { char: '🍬', name: 'candy' },
            { char: '🍭', name: 'lollipop' },
            { char: '☕', name: 'hot beverage' },
            { char: '🍺', name: 'beer mug' },
            { char: '🍷', name: 'wine glass' },
            { char: '🍹', name: 'tropical drink' }
        ]
    },
    {
        name: 'activities',
        label: 'Activities',
        emojis: [
            { char: '⚽', name: 'soccer ball' },
            { char: '🏀', name: 'basketball' },
            { char: '🏈', name: 'american football' },
            { char: '⚾', name: 'baseball' },
            { char: '🥎', name: 'softball' },
            { char: '🎾', name: 'tennis' },
            { char: '🏐', name: 'volleyball' },
            { char: '🏉', name: 'rugby football' },
            { char: '🎱', name: 'pool 8 ball' },
            { char: '🏓', name: 'ping pong' },
            { char: '🏸', name: 'badminton' },
            { char: '🥅', name: 'goal net' },
            { char: '🎯', name: 'bullseye' },
            { char: '🎮', name: 'video game' },
            { char: '🕹️', name: 'joystick' },
            { char: '🎰', name: 'slot machine' },
            { char: '🎲', name: 'game die' },
            { char: '🧩', name: 'puzzle piece' },
            { char: '🎨', name: 'artist palette' },
            { char: '🎭', name: 'performing arts' },
            { char: '🎬', name: 'clapper board' },
            { char: '🎤', name: 'microphone' },
            { char: '🎧', name: 'headphone' },
            { char: '🎸', name: 'guitar' },
            { char: '🎹', name: 'musical keyboard' },
            { char: '🎷', name: 'saxophone' },
            { char: '🎺', name: 'trumpet' },
            { char: '🎻', name: 'violin' },
            { char: '🚗', name: 'automobile' },
            { char: '🚕', name: 'taxi' },
            { char: '🚙', name: 'sport utility vehicle' },
            { char: '🚌', name: 'bus' },
            { char: '🏎️', name: 'racing car' },
            { char: '🚓', name: 'police car' },
            { char: '🚑', name: 'ambulance' },
            { char: '🚒', name: 'fire engine' },
            { char: '🚲', name: 'bicycle' },
            { char: '🛫', name: 'airplane departure' },
            { char: '✈️', name: 'airplane' },
            { char: '🚀', name: 'rocket' }
        ]
    },
    {
        name: 'objects',
        label: 'Objects',
        emojis: [
            { char: '💡', name: 'light bulb' },
            { char: '💻', name: 'laptop' },
            { char: '🖥️', name: 'desktop computer' },
            { char: '⌨️', name: 'keyboard' },
            { char: '🖱️', name: 'computer mouse' },
            { char: '📱', name: 'mobile phone' },
            { char: '☎️', name: 'telephone' },
            { char: '📺', name: 'television' },
            { char: '📷', name: 'camera' },
            { char: '💿', name: 'optical disk' },
            { char: '💵', name: 'dollar banknote' },
            { char: '🪙', name: 'coin' },
            { char: '✉️', name: 'envelope' },
            { char: '📦', name: 'package' },
            { char: '📝', name: 'memo' },
            { char: '📅', name: 'calendar' },
            { char: '🗑️', name: 'wastebasket' },
            { char: '🔒', name: 'locked' },
            { char: '🔑', name: 'key' },
            { char: '🔧', name: 'wrench' },
            { char: '🔨', name: 'hammer' },
            { char: '🛡️', name: 'shield' },
            { char: '💉', name: 'syringe' },
            { char: '💊', name: 'pill' },
            { char: '🎈', name: 'balloon' },
            { char: '🎁', name: 'wrapped gift' },
            { char: '📚', name: 'books' },
            { char: '📌', name: 'pushpin' },
            { char: '📍', name: 'round pushpin' },
            { char: '📎', name: 'paperclip' }
        ]
    }
];

const filteredEmojis = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) {
        const cat = emojiCategories.find(c => c.name === activeCategoryName.value);
        return cat ? cat.emojis : [];
    }

    const results: { char: string; name: string }[] = [];
    emojiCategories.forEach(cat => {
        cat.emojis.forEach(emoji => {
            if (emoji.name.toLowerCase().includes(q)) {
                results.push(emoji);
            }
        });
    });
    return results;
});

const selectEmoji = (emoji: string) => {
    emit('select', emoji);
};

const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
        emit('close');
    }
};

onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<template>
    <div ref="containerRef" class="absolute bottom-16 right-0 z-50 w-64 h-80 flex flex-col bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
        <div class="p-2 border-b border-zinc-100 flex items-center bg-zinc-50/50">
            <div class="relative flex-1">
                <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search emojis..."
                    class="w-full text-[11px] bg-white border border-zinc-200 rounded-lg pl-8 pr-2 py-1.5 focus:border-zinc-300 focus:outline-none placeholder-zinc-400"
                />
            </div>
        </div>

        <div v-if="!searchQuery" class="flex border-b border-zinc-100 bg-zinc-50/20 px-1 py-0.5 shrink-0 justify-between">
            <button
                v-for="cat in emojiCategories"
                :key="cat.name"
                type="button"
                @click="activeCategoryName = cat.name"
                class="inline-flex items-center justify-center h-6.5 w-6.5 rounded-md transition focus:outline-none"
                :class="activeCategoryName === cat.name ? 'bg-zinc-100 text-zinc-800' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'"
                :title="cat.label"
            >
                <component :is="categoryIcons[cat.name as keyof typeof categoryIcons]" class="h-3.5 w-3.5" />
            </button>
        </div>

        <div class="flex-1 overflow-y-auto p-2">
            <div v-if="filteredEmojis.length === 0" class="flex flex-col items-center justify-center h-full text-zinc-400 text-[11px] py-8">
                No emojis found
            </div>
            <div v-else class="grid grid-cols-7 gap-1">
                <button
                    v-for="emoji in filteredEmojis"
                    :key="emoji.char"
                    type="button"
                    @click="selectEmoji(emoji.char)"
                    class="h-7 w-7 inline-flex items-center justify-center text-md rounded-md hover:bg-zinc-100 transition active:scale-95 focus:outline-none"
                    :title="emoji.name"
                >
                    {{ emoji.char }}
                </button>
            </div>
        </div>
    </div>
</template>
