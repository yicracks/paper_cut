import xi from './xi.svg?raw';
import fu from './fu.svg?raw';
import crescent from './crescent.svg?raw';
import plum from './plum.svg?raw';
import peach from './peach.svg?raw';
import cloud from './cloud.svg?raw';
import goldfish from './goldfish.svg?raw';
import tiger from './tiger.svg?raw';
import dragon from './dragon.svg?raw';
import rabbit from './rabbit.svg?raw';
import ram from './ram.svg?raw';
import lion from './lion.svg?raw';
import fish from './fish.svg?raw';
import lantern from './lantern.svg?raw';
import coin from './coin.svg?raw';
import hearts from './hearts.svg?raw';
import ducks from './ducks.svg?raw';

export interface StencilPattern {
  id: string;
  nameZh: string;
  nameEn: string;
  svgContent: string;
  category: 'traditional' | 'zodiac' | 'astrology' | 'wedding' | 'duanwu';
}

export const STENCILS: StencilPattern[] = [
  // Traditional
  { id: 'crescent', nameZh: '月牙纹', nameEn: 'Crescent Moon', svgContent: crescent, category: 'traditional' },
  { id: 'plum', nameZh: '梅花瓣', nameEn: 'Plum Blossom', svgContent: plum, category: 'traditional' },
  { id: 'peach', nameZh: '寿桃纹', nameEn: 'Longevity Peach', svgContent: peach, category: 'traditional' },
  { id: 'cloud', nameZh: '祥云纹', nameEn: 'Auspicious Cloud', svgContent: cloud, category: 'traditional' },
  { id: 'goldfish', nameZh: '连年有余', nameEn: 'Goldfish Surplus', svgContent: goldfish, category: 'traditional' },
  { id: 'classic_star', nameZh: '璀璨八角星', nameEn: 'Octagram Star', category: 'traditional', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,5 L54,30 L75,15 L62,38 L95,50 L62,62 L75,85 L54,70 L50,95 L46,70 L25,85 L38,62 L5,50 L38,38 L25,15 L46,30 Z" />
      <circle cx="50" cy="50" r="10" />
    </svg>`
  },
  { id: 'classic_flower', nameZh: '富贵吉祥花', nameEn: 'Auspicious Flower', category: 'traditional', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,38 C42,28 25,32 28,45 C20,45 15,62 26,68 C30,78 48,82 50,70 C52,82 70,78 74,68 C85,62 80,45 72,45 C75,32 58,28 50,38 Z" />
      <circle cx="50" cy="55" r="4" />
      <path d="M50,55 L50,45" stroke="currentColor" stroke-width="2" />
      <path d="M50,55 L42,48" stroke="currentColor" stroke-width="2" />
      <path d="M50,55 L58,48" stroke="currentColor" stroke-width="2" />
    </svg>`
  },

  // Chinese Zodiac (Full 12)
  { id: 'zodiac_rat', nameZh: '子鼠 · 招财鼠', nameEn: 'Golden Rat', category: 'zodiac', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,15 C35,15 26,25 26,42 C26,58 36,74 50,74 C64,74 74,58 74,42 C74,25 65,15 50,15 Z M36,25 C40,25 43,30 38,36 C33,36 34,25 36,25 Z M64,25 C68,25 69,30 62,36 C57,36 60,25 64,25 Z M50,42 A5,5 0 1,1 50,52 A5,5 0 1,1 50,42 Z M50,74 C50,84 40,88 30,88 L30,83 C38,83 45,78 45,74 Z" />
    </svg>`
  },
  { id: 'zodiac_ox', nameZh: '丑牛 · 勤劳牛', nameEn: 'Sturdy Ox', category: 'zodiac', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,15 C45,15 35,20 30,30 C20,25 10,28 10,40 C10,55 25,60 35,62 L30,85 L38,85 L42,65 H58 L62,85 L70,85 L65,62 C75,60 90,55 90,40 C90,28 80,25 70,30 C65,20 55,15 50,15 Z M32,45 A4,4 0 1,1 32,37 A4,4 0 1,1 32,45 Z M68,45 A4,4 0 1,1 68,37 A4,4 0 1,1 68,45 Z" />
    </svg>`
  },
  { id: 'tiger', nameZh: '寅虎 · 福虎生威', nameEn: 'Lucky Tiger', svgContent: tiger, category: 'zodiac' },
  { id: 'rabbit', nameZh: '卯兔 · 玉兔呈祥', nameEn: 'Jade Rabbit', svgContent: rabbit, category: 'zodiac' },
  { id: 'dragon', nameZh: '辰龙 · 祥龙献瑞', nameEn: 'Auspicious Dragon', svgContent: dragon, category: 'zodiac' },
  { id: 'zodiac_snake', nameZh: '巳蛇 · 灵蛇起舞', nameEn: 'Auspicious Snake', category: 'zodiac', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,8 C42,8 34,15 34,25 C34,35 45,38 45,48 C45,58 30,58 30,71 C30,83 40,94 55,94 C70,94 82,84 82,72 L72,72 C72,80 65,86 55,86 C45,86 40,78 40,71 C40,63 55,63 55,48 C55,33 44,30 44,25 C44,20 48,16 52,16 C56,16 60,20 60,25 L70,25 C70,13 60,8 50,8 Z" />
    </svg>`
  },
  { id: 'zodiac_horse', nameZh: '午马 · 奔腾骏马', nameEn: 'Galloping Horse', category: 'zodiac', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M25,85 L35,85 L45,55 C40,50 35,42 35,30 C35,20 40,15 50,15 C55,15 62,18 70,12 L75,20 C68,26 62,28 62,35 C62,45 65,50 75,55 L80,85 L70,85 L65,65 H55 L50,85 L40,85 L48,60 H38 Z" />
    </svg>`
  },
  { id: 'zodiac_sheep', nameZh: '未羊 · 三阳开泰', nameEn: 'Auspicious Sheep', category: 'zodiac', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,12 C42,12 32,17 32,30 C32,35 35,40 40,44 L35,85 L44,85 L47,56 H53 L56,85 L65,85 L60,44 C65,40 68,35 68,30 C68,17 58,12 50,12 Z M23,26 C26,19 34,17 37,23 C30,23 26,29 23,26 Z M77,26 C74,19 66,17 63,23 C70,23 74,29 77,26 Z" />
    </svg>`
  },
  { id: 'zodiac_monkey', nameZh: '申猴 · 金猴献桃', nameEn: 'Lucky Monkey', category: 'zodiac', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,12 C32,12 25,25 25,42 C25,55 32,68 50,68 C68,68 75,55 75,42 C75,25 68,12 50,12 Z M35,30 C40,28 45,32 45,38 C38,38 32,35 35,30 Z M65,30 C60,28 55,32 55,38 C62,38 68,35 65,30 Z M50,42 A6,6 0 1,1 50,54 A6,6 0 1,1 50,42 Z" />
    </svg>`
  },
  { id: 'zodiac_rooster', nameZh: '酉鸡 · 金鸡报晓', nameEn: 'Rooster Dawn', category: 'zodiac', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M25,85 L35,85 L38,62 C28,62 18,52 18,38 C28,38 35,45 42,48 C42,44 40,38 40,32 C40,22 48,15 55,15 C58,8 65,12 68,16 C75,10 82,18 78,28 C85,32 82,45 74,52 C70,55 65,58 60,60 L62,85 L52,85 L48,65 H42 Z" />
    </svg>`
  },
  { id: 'zodiac_dog', nameZh: '戌狗 · 神犬守户', nameEn: 'Aesthetic Dog', category: 'zodiac', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,15 C42,15 36,22 36,32 C36,36 32,40 25,40 C18,40 14,48 14,60 C14,75 25,85 48,85 C70,85 82,72 82,58 C82,42 70,30 54,30 C54,22 58,15 50,15 Z M32,54 A4,4 0 1,1 32,46 A4,4 0 1,1 32,54 Z" />
    </svg>`
  },
  { id: 'zodiac_pig', nameZh: '亥猪 · 纳福金猪', nameEn: 'Chubby Pig', category: 'zodiac', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,20 C28,20 18,32 18,52 C18,72 32,82 50,82 C68,82 82,72 82,52 C82,32 72,20 50,20 Z M38,40 A4,4 0 1,1 38,32 A4,4 0 1,1 38,40 Z M62,40 A4,4 0 1,1 62,32 A4,4 0 1,1 62,40 Z M50,52 C42,52 38,60 50,60 C62,60 58,52 50,52 Z" />
    </svg>`
  },

  // Western Astrology (Full 12)
  { id: 'ram', nameZh: '白羊座', nameEn: 'Aries Ram', svgContent: ram, category: 'astrology' },
  { id: 'astro_taurus', nameZh: '金牛座', nameEn: 'Taurus Bull', category: 'astrology', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,30 C34,30 22,42 22,58 C22,74 34,86 50,86 C66,86 78,74 78,58 C78,42 66,30 50,30 Z M38,55 A5,5 0 1,1 38,45 A5,5 0 1,1 38,55 Z M62,55 A5,5 0 1,1 62,45 A5,5 0 1,1 62,55 Z M50,14 C42,14 26,18 20,24 C32,26 42,20 50,26 C58,20 68,26 80,24 C74,18 58,14 50,14 Z" />
    </svg>`
  },
  { id: 'astro_gemini', nameZh: '双子座', nameEn: 'Gemini Twins', category: 'astrology', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M30,15 C20,15 15,22 15,32 C15,42 22,50 30,50 C38,50 45,42 45,32 C45,22 40,15 30,15 Z M70,15 C60,15 55,22 55,32 C55,42 62,50 70,50 C78,50 85,42 85,32 C85,22 80,15 70,15 Z M25,60 H75 L70,85 H30 Z" fill-rule="evenodd" />
    </svg>`
  },
  { id: 'astro_cancer', nameZh: '巨蟹座', nameEn: 'Cancer Crab', category: 'astrology', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,25 C32,25 22,38 22,52 C22,66 32,78 50,78 C68,78 78,66 78,52 C78,38 68,25 50,25 Z M10,42 C8,28 20,22 26,30 C20,38 18,48 10,42 Z M90,42 C92,28 80,22 74,30 C80,38 82,48 90,42 Z" />
    </svg>`
  },
  { id: 'lion', nameZh: '狮子座', nameEn: 'Leo Lion', svgContent: lion, category: 'astrology' },
  { id: 'astro_virgo', nameZh: '处女座', nameEn: 'Virgo Maiden', category: 'astrology', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,10 C35,10 25,22 25,40 C25,58 35,70 50,70 C65,70 75,58 75,40 C75,22 65,10 50,10 Z M50,22 A8,8 0 1,1 50,38 A8,8 0 1,1 50,22 Z M35,45 C42,42 45,55 35,58 L30,85 L38,85 L42,65 Z M65,45 C58,42 55,55 65,58 L70,85 L62,85 L58,65 Z" />
    </svg>`
  },
  { id: 'astro_libra', nameZh: '天秤座', nameEn: 'Libra Scales', category: 'astrology', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,15 L48,15 L48,70 L20,70 L20,75 L80,75 L80,70 L52,70 L52,15 Z M25,45 C25,35 32,30 38,30 C44,30 45,35 45,45 Z M75,45 C75,35 68,30 62,30 C56,30 55,35 55,45 Z" fill-rule="evenodd" />
    </svg>`
  },
  { id: 'astro_scorpio', nameZh: '天蝎座', nameEn: 'Scorpio Scorpion', category: 'astrology', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,15 C42,15 36,25 36,35 C36,45 42,50 42,62 C42,75 30,85 15,85 L15,75 C25,75 32,70 32,62 C32,50 25,42 25,32 C25,18 36,5 50,5 C64,5 75,18 75,32 C75,42 68,50 68,62 C68,70 75,75 85,75 L85,85 C70,85 58,75 58,62 C58,50 64,45 64,35 C64,25 58,15 50,15 Z" />
    </svg>`
  },
  { id: 'astro_sagittarius', nameZh: '射手座', nameEn: 'Sagittarius Archer', category: 'astrology', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M85,15 L60,15 L65,25 L45,45 L15,40 L15,50 L40,55 L20,75 L25,80 L45,60 L50,85 L60,85 L55,55 L75,35 L85,40 Z" />
    </svg>`
  },
  { id: 'astro_capricorn', nameZh: '摩羯座', nameEn: 'Capricorn Goat', category: 'astrology', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,15 C40,15 30,22 30,35 C30,48 42,52 42,65 C42,78 30,85 15,85 L15,75 C25,75 32,70 32,65 C32,52 20,48 20,35 C20,18 32,5 50,5 C68,5 80,18 80,35 C80,48 68,52 68,65 C68,70 75,75 85,75 L85,85 C70,85 58,78 58,65 C58,52 70,48 70,35 C70,22 60,15 50,15 Z" />
    </svg>`
  },
  { id: 'astro_aquarius', nameZh: '水瓶座', nameEn: 'Aquarius Water', category: 'astrology', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,10 C40,10 32,18 32,32 L22,42 L25,85 H75 L78,42 L68,32 C68,18 60,10 50,10 Z M50,22 A5,5 0 1,1 50,12 A5,5 0 1,1 50,22 Z M42,42 L38,62 H62 L58,42 Z" />
    </svg>`
  },
  { id: 'fish', nameZh: '双鱼座', nameEn: 'Pisces Fish', svgContent: fish, category: 'astrology' },

  // Wedding & Love
  { id: 'xi', nameZh: '囍 双喜临门', nameEn: 'Double Happiness', svgContent: xi, category: 'wedding' },
  { id: 'fu', nameZh: '福 迎春纳福', nameEn: 'Auspicious Fu', svgContent: fu, category: 'wedding' },
  { id: 'cake', nameZh: '甜蜜婚礼蛋糕', nameEn: 'Wedding Cake', category: 'wedding', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M20,65 L80,65 C85,65 85,85 80,85 L20,85 C15,85 15,65 20,65 Z" />
      <path d="M28,45 L72,45 C76,45 76,60 72,60 L28,60 C24,60 24,45 28,45 Z" />
      <path d="M36,28 L64,28 C67,28 67,40 64,40 L36,40 C33,40 33,28 36,28 Z" />
      <rect x="48" y="15" width="4" height="10" rx="1" />
      <path d="M50,7 C52,9 52,13 50,14 C48,13 48,9 50,7 Z" />
    </svg>`
  },
  { id: 'lantern', nameZh: '喜庆大红灯笼', nameEn: 'Festive Lantern', svgContent: lantern, category: 'wedding' },
  { id: 'hearts', nameZh: '心心相印', nameEn: 'Double Hearts', svgContent: hearts, category: 'wedding' },
  { id: 'ducks', nameZh: '鸳鸯戏水', nameEn: 'Mandarin Ducks', svgContent: ducks, category: 'wedding' },
  { id: 'coin', nameZh: '招财进宝金币', nameEn: 'Fortune Coin', svgContent: coin, category: 'wedding' },

  // Dragon Boat Festival (端午节)
  { id: 'duanwu_zongzi', nameZh: '端阳安康粽', nameEn: 'Auspicious Zongzi', category: 'duanwu', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,10 L15,75 C10,83 18,88 26,88 L74,88 C82,88 90,83 85,75 Z" />
      <path d="M50,10 L30,88 M50,10 L70,88 M15,75 C35,68 65,68 85,75" stroke="white" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <path d="M22,55 C38,48 62,62 78,55" stroke="white" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M22,55 C38,48 62,62 78,55" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" />
      <circle cx="50" cy="55.5" r="3.5" fill="white" />
    </svg>`
  },
  { id: 'duanwu_dragon', nameZh: '五月端阳龙', nameEn: 'Duanwu Festive Dragon', category: 'duanwu', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,5 C32,5 20,20 20,38 C20,55 30,68 50,85 C70,68 80,55 80,38 C80,20 68,5 50,5 Z M35,32 A4,4 0 1,1 35,24 A4,4 0 1,1 35,32 Z M65,32 A4,4 0 1,1 65,24 A4,4 0 1,1 65,32 Z M50,48 C42,48 35,55 35,62 C35,68 42,75 50,75 C58,75 65,68 65,62 C65,55 58,48 50,48 Z" />
      <path d="M30,5 C25,-5 15,2 18,10 Z M70,5 C75,-5 85,2 82,10 Z" />
    </svg>`
  },
  { id: 'duanwu_dragonboat', nameZh: '竞渡龙神舟', nameEn: 'Racing Dragon Boat', category: 'duanwu', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M0,75 C12,70 24,80 36,75 C48,70 60,80 72,75 C84,70 96,80 100,76 L100,92 L0,92 Z" />
      <path d="M5,54 C25,64 75,64 92,48 C85,58 15,58 5,54 Z" />
      <path d="M85,50 C88,48 94,42 94,34 C94,28 88,24 84,28 C82,24 76,26 76,32 C76,38 80,44 84,50 Z" />
      <path d="M10,55 C6,48 4,40 8,36 C12,32 14,40 14,48 Z" />
      <path d="M86,22 C88,16 92,16 90,24 Z" />
      <path d="M28,56 L22,70 M42,56 L36,70 M56,56 L50,70 M70,56 L64,70" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <rect x="47" y="44" width="7" height="9" rx="1" />
      <circle cx="50.5" cy="48.5" r="2" fill="white" />
    </svg>`
  },
  { id: 'duanwu_xiangnang', nameZh: '辟邪五彩香囊', nameEn: 'Amulet Perfume Sachet', category: 'duanwu', svgContent: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50,14 L82,46 L50,78 L18,46 Z" />
      <circle cx="50" cy="46" r="9" fill="white" />
      <circle cx="50" cy="46" r="4.5" fill="currentColor" />
      <path d="M50,14 C50,2 50,2 49,4" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M50,78 L50,96 M45,79 L41,94 M55,79 L59,94" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>`
  }
];
