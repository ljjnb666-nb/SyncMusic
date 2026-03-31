<template>
  <component :is="iconComponent" :size="size" :color="color" :stroke-width="strokeWidth" />
</template>

<script setup>
import {
  Search, Download, Music, ListMusic, Headphones, Link, Plus, X,
  Play, Pause, SkipForward, SkipBack, Volume2, Volume1, VolumeX, FolderOpen, Upload,
  Check, ChevronRight, RefreshCw, Clock, User, Crown, Copy,
  Settings, Info, AlertCircle, Music2, Disc, Mic2, ListVideo,
  ChevronDown, Eye, EyeOff, PlusCircle, MinusCircle, Trash2,
  Edit, Save, Share2, ExternalLink, Home, Wifi, WifiOff,
  Loader2, CheckCircle2, XCircle, AlertTriangle, HelpCircle,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Maximize2, Minimize2,
  MoreHorizontal, MoreVertical, Filter, SortAsc, SortDesc,
  Calendar, FileAudio, FileText, Image, Film, Globe, Shield,
  Zap, Sparkles, Heart, Star, ThumbsUp, Share, UserPlus,
  LogIn, LogOut, Cloud, Repeat, Shuffle
} from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [Number, String],
    default: 20
  },
  color: {
    type: String,
    default: 'currentColor'
  },
  strokeWidth: {
    type: [Number, String],
    default: 2
  }
})

const iconMap = {
  // 通用
  'search': Search,
  'search-x': Search,
  'download': Download,
  'music': Music,
  'music2': Music2,
  'list-music': ListMusic,
  'headphones': Headphones,
  'link': Link,
  'plus': Plus,
  'x': X,
  'play': Play,
  'pause': Pause,
  'skip-forward': SkipForward,
  'skip-back': SkipBack,
  'volume': Volume2,
  'volume-1': Volume1,
  'volume-x': VolumeX,
  'folder': FolderOpen,
  'upload': Upload,
  'check': Check,
  'chevron-right': ChevronRight,
  'clock': Clock,
  'user': User,
  'crown': Crown,
  'copy': Copy,
  'settings': Settings,
  'info': Info,
  'alert': AlertCircle,
  'disc': Disc,
  'mic': Mic2,
  'list': ListVideo,
  'chevron-down': ChevronDown,
  'eye': Eye,
  'eye-off': EyeOff,
  'plus-circle': PlusCircle,
  'minus-circle': MinusCircle,
  'trash': Trash2,
  'edit': Edit,
  'save': Save,
  'share': Share2,
  'external-link': ExternalLink,
  'home': Home,
  'log-in': LogIn,
  'log-out': LogOut,
  'cloud': Cloud,
  'wifi': Wifi,
  'wifi-off': WifiOff,
  'loader': Loader2,
  'check-circle': CheckCircle2,
  'x-circle': XCircle,
  'alert-triangle': AlertTriangle,
  'help': HelpCircle,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'maximize': Maximize2,
  'minimize': Minimize2,
  'more': MoreHorizontal,
  'more-vertical': MoreVertical,
  'filter': Filter,
  'sort': SortAsc,
  'calendar': Calendar,
  'file-audio': FileAudio,
  'file-text': FileText,
  'image': Image,
  'film': Film,
  'globe': Globe,
  'shield': Shield,
  'zap': Zap,
  'sparkles': Sparkles,
  'heart': Heart,
  'star': Star,
  'thumbs-up': ThumbsUp,
  'user-plus': UserPlus,
  'users': UserPlus,
  'repeat-one': Repeat,
  'repeat': Repeat,
  'shuffle': Shuffle,
  // 平台
  'netease': 'N',
  'qq': 'Q',
  'kugou': 'K',
  'migu': 'M'
}

const iconComponent = computed(() => {
  const icon = iconMap[props.name]
  return icon || Music
})
</script>

<script>
import { computed } from 'vue'
</script>
