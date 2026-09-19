export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type Color = 'white'|'orange'|'magenta'|'light_blue'|'yellow'|'lime'|'pink'|'gray'|'light_gray'|'cyan'|'purple'|'blue'|'brown'|'green'|'red'|'black';
export type SofaShape = 'single'|'left'|'middle'|'right'|'left_corner'|'right_corner';
export type Connection = 'east_west'|'north_south'|'cross_east_west'|'cross_north_south'|'cross_up_down'|'six_direction';
export type Variant = 'normal'|'ice'|'gold';
export type VisualRequest =
  | { family: 'decorated_board'; state: { variant: "base"|"allium"|"azure_bluet"|"cornflower"|"grass"|"orchid"|"peony"|"pink_petals"|"pitcher_plant"|"poppy"|"sunflower"|"torchflower"|"tulip"|"wither_rose" } }
  | { family: 'board_parts'; state: { variant: "allium"|"azure_bluet"|"cornflower"|"grass"|"orchid"|"peony"|"pink_petals"|"pitcher_plant"|"poppy"|"sunflower"|"torchflower"|"tulip"|"wither_rose" } }
  | { family: 'chalkboard'; state: { size: "small"|"large" } }
  | { family: 'bottle_display'; state: { variant: "molotov"|"water_bottle"|"potion_bottle"|"honey_bottle"|"xp_bottle"|"dragon_breath_bottle" } }
  | { family: 'item_display'; state: { item: "kaleidoscope_tavern:allium_sandwich_board"|"kaleidoscope_tavern:azure_bluet_sandwich_board"|"kaleidoscope_tavern:bar_cabinet"|"kaleidoscope_tavern:bar_counter"|"kaleidoscope_tavern:barrel"|"kaleidoscope_tavern:base_sandwich_board"|"kaleidoscope_tavern:black_bar_stool"|"kaleidoscope_tavern:black_sofa"|"kaleidoscope_tavern:blue_bar_stool"|"kaleidoscope_tavern:blue_sofa"|"kaleidoscope_tavern:brown_bar_stool"|"kaleidoscope_tavern:brown_sofa"|"kaleidoscope_tavern:cellar_cabinet"|"kaleidoscope_tavern:circular_rack"|"kaleidoscope_tavern:cornflower_sandwich_board"|"kaleidoscope_tavern:cyan_bar_stool"|"kaleidoscope_tavern:cyan_sofa"|"kaleidoscope_tavern:glass_bar_cabinet"|"kaleidoscope_tavern:glassware_holder"|"kaleidoscope_tavern:grass_sandwich_board"|"kaleidoscope_tavern:gray_bar_stool"|"kaleidoscope_tavern:gray_sofa"|"kaleidoscope_tavern:green_bar_stool"|"kaleidoscope_tavern:green_sofa"|"kaleidoscope_tavern:light_blue_bar_stool"|"kaleidoscope_tavern:light_blue_sofa"|"kaleidoscope_tavern:light_gray_bar_stool"|"kaleidoscope_tavern:light_gray_sofa"|"kaleidoscope_tavern:lime_bar_stool"|"kaleidoscope_tavern:lime_sofa"|"kaleidoscope_tavern:magenta_bar_stool"|"kaleidoscope_tavern:magenta_sofa"|"kaleidoscope_tavern:orange_bar_stool"|"kaleidoscope_tavern:orange_sofa"|"kaleidoscope_tavern:orchid_sandwich_board"|"kaleidoscope_tavern:peony_sandwich_board"|"kaleidoscope_tavern:pink_bar_stool"|"kaleidoscope_tavern:pink_petals_sandwich_board"|"kaleidoscope_tavern:pink_sofa"|"kaleidoscope_tavern:pitcher_plant_sandwich_board"|"kaleidoscope_tavern:poppy_sandwich_board"|"kaleidoscope_tavern:pressing_tub"|"kaleidoscope_tavern:purple_bar_stool"|"kaleidoscope_tavern:purple_sofa"|"kaleidoscope_tavern:red_bar_stool"|"kaleidoscope_tavern:red_sofa"|"kaleidoscope_tavern:shaker"|"kaleidoscope_tavern:shaker_3d"|"kaleidoscope_tavern:string_lights_black"|"kaleidoscope_tavern:string_lights_blue"|"kaleidoscope_tavern:string_lights_brown"|"kaleidoscope_tavern:string_lights_colorless"|"kaleidoscope_tavern:string_lights_cyan"|"kaleidoscope_tavern:string_lights_gray"|"kaleidoscope_tavern:string_lights_green"|"kaleidoscope_tavern:string_lights_light_blue"|"kaleidoscope_tavern:string_lights_light_gray"|"kaleidoscope_tavern:string_lights_lime"|"kaleidoscope_tavern:string_lights_magenta"|"kaleidoscope_tavern:string_lights_orange"|"kaleidoscope_tavern:string_lights_pink"|"kaleidoscope_tavern:string_lights_purple"|"kaleidoscope_tavern:string_lights_red"|"kaleidoscope_tavern:string_lights_white"|"kaleidoscope_tavern:string_lights_yellow"|"kaleidoscope_tavern:sunflower_sandwich_board"|"kaleidoscope_tavern:table"|"kaleidoscope_tavern:tilted_rack"|"kaleidoscope_tavern:torchflower_sandwich_board"|"kaleidoscope_tavern:trellis"|"kaleidoscope_tavern:tulip_sandwich_board"|"kaleidoscope_tavern:white_bar_stool"|"kaleidoscope_tavern:white_sofa"|"kaleidoscope_tavern:wither_rose_sandwich_board"|"kaleidoscope_tavern:yellow_bar_stool"|"kaleidoscope_tavern:yellow_sofa" } }
  | { family: 'string_lights'; state: { color: Color|'colorless' } }
  | { family: 'incense'; state: { variant: 'sakura'|'pine'|'ginkgo'|'spore'|'catnip'|'snow'|'butterfly'|'firefly'; state: 'closed'|'open' } }
  | { family: 'painting'; state: { work: 'mondrian'|'great_wave'|'mona_lisa'|'cr019'|'david'|'father'|'girl_with_pearl_earring'|'master_marisa'|'son_of_man'|'starry_night'|'van_gogh_self_portrait'|'ysbb'|'tartaric_acid'|'unknown' } }
  | { family: 'bar_stool'; state: { color: Color } }
  | { family: 'table'; state: { shape: 'single'|'left'|'middle'|'right'|'left_rot'|'middle_rot'|'right_rot' } }
  | { family: 'pendant_lamp'; state: { style: 'bell'|'blue'|'yellow'; section: 'bottom'|'top'|'assembled' } }
  | { family: 'stepladder'|'sandwich_board'; state: { section: 'bottom'|'top'|'assembled' } }
  | { family: 'bar_counter'; state: { shape: SofaShape } }
  | { family: 'sofa'; state: { color: Color; shape: SofaShape } }
  | { family: 'bottled_drink'; state: { drink: 'wine'|'champagne'|'honey_wine'|'ice_wine'|'vodka'|'rum'|'sherry'|'red_queen'|'vinegar'|'whiskey'|'miners_star'|'sauvignon_blanc_dry_white'|'sweet_berry_wine'|'sakura_wine'|'glowflower_brew'|'luminous_bride'|'madame_shexiang'|'mother_snow'|'plum_wine'|'polaris_sweet_white'|'riesling_dry_white'|'watermelon_juice'; count: 1|2|3|4 } }
  | { family: 'bottled_drink'; state: { drink: 'brandy'|'carignan'|'sunset_glow'; count: 1|2|3 } }
  | { family: 'grape_crop'; state: { variant: Variant; stage: 0|1|2|3|4|5 } }
  | { family: 'grapevine'; state: { variant: Variant; form: 'stage0'|'stage1'|'stage2'|'stage3'|Connection } }
  | { family: 'trellis'; state: { form: 'single'|Connection } }
  | { family: 'barrel'; state: { lid: 'closed'|'open' } }
  | { family: 'tap'; state: { handle: 'closed'|'open' } }
  | { family: 'pressing_tub'; state: { pose: 'upright'|'tilted' } }
  | { family: 'wild_grapevine'; state: { section: 'tip'|'stem' } }
  | { family: 'empty_bottle'; state?: Record<string, never> }
  | { family: 'cabinet'; state: { type: 'bar_cabinet'|'glass_bar_cabinet'|'cellar_cabinet'; shape: 'single'|'left'|'middle'|'right' } }
  | { family: 'rack'; state: { type: 'tilted_rack'|'circular_rack'|'glassware_holder'|'holder' } }
  | { family: 'empty_glassware'; state?: Record<string, never> }
  | { family: 'shaker'; state?: Record<string, never> }
  | { family: 'cocktail'; state: { drink: 'emerald'|'screwdriver'|'depth_charge'|'mojito'|'signature_cocktail'|'mystery_cocktail'|'white_lady'|'allium_garden'|'bloody_mary'|'brass_heart'|'godfather'|'grasshopper'|'nether_special'|'sculk_special' } };
export interface VisualBinding {
  readonly key: string;
  readonly binding: Readonly<{ kind: 'block'|'entity'; id: string; definition: string; [key: string]: Json|undefined }>;
  readonly geometry: Readonly<{ identifier: string; file: string; sha256: string }>;
  readonly textures: ReadonlyArray<Readonly<{ file: string; sha256: string }>>;
  readonly labels: Readonly<Record<string, string>>;
  readonly editor_file: string;
  readonly engine_accepted: false;
  readonly runtime_connected: false;
}
export interface IconBinding { readonly key: string; readonly id: string; readonly definition: string; readonly animation: string; readonly engine_accepted: false; }
export class AssetInterfaceError extends Error { readonly code: string; readonly details: Readonly<Record<string, unknown>>; }
export interface AssetRegistry {
  getVisual(key: string): VisualBinding;
  getIcon(key: string): IconBinding;
  selectVisual(request: VisualRequest): VisualBinding;
  blockVisual(key: string, context?: 'world'|'inventory'): Readonly<Record<string, Json>>;
  getByFixtureId(id: string): VisualBinding|IconBinding;
  listVisuals(): readonly VisualBinding[];
  listIcons(): readonly IconBinding[];
  listFamilies(): readonly unknown[];
  catalog(locale?: 'zh_TW'|'zh_CN'|'en_US'): readonly Readonly<{key: string; name: string; fixtureId: string; geometry: string; editor: string; recipes: readonly []; engineAccepted: false}>[];
}
export function createAssetRegistry(input: unknown): AssetRegistry;
export function resolveCookeryItem(alias: string, mapping: unknown, lock: unknown): string;
