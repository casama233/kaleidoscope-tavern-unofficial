import { createAssetRegistry, type VisualRequest } from '../sdk/index.mjs';
declare const input: unknown;
const api = createAssetRegistry(input);
api.selectVisual({family:'sofa',state:{color:'blue',shape:'left_corner'}});
api.selectVisual({family:'bottled_drink',state:{drink:'wine',count:4}});
api.selectVisual({family:'empty_bottle'});
// @ts-expect-error Unsupported color is not a valid visual state.
api.selectVisual({family:'sofa',state:{color:'ultraviolet',shape:'single'}});
// @ts-expect-error Five bottles is not a converted state.
api.selectVisual({family:'bottled_drink',state:{drink:'wine',count:5}});
// @ts-expect-error There is no portable inventory binding for arbitrary poses.
api.blockVisual('wine_1','first_person');
const request: VisualRequest = {family:'grapevine',state:{variant:'ice',form:'six_direction'}};
const resolved=api.selectVisual(request);
// @ts-expect-error Read-only return value.
resolved.binding.id='wrong';

api.selectVisual({family:'bottled_drink',state:{drink:'vodka',count:4}});
api.selectVisual({family:'cabinet',state:{type:'cellar_cabinet',shape:'middle'}});
api.selectVisual({family:'rack',state:{type:'glassware_holder'}});
// A10: Holder now has its own converted model.
api.selectVisual({family:'rack',state:{type:'holder'}});
// @ts-expect-error Cabinet corners are not among the four source variants.
api.selectVisual({family:'cabinet',state:{type:'bar_cabinet',shape:'corner'}});

api.selectVisual({family:'bottled_drink',state:{drink:'vinegar',count:4}});
api.selectVisual({family:'bottled_drink',state:{drink:'sauvignon_blanc_dry_white',count:1}});
api.selectVisual({family:'empty_glassware'});
api.selectVisual({family:'cocktail',state:{drink:'screwdriver'}});
// @ts-expect-error Empty glass has no quality/fill state in the resource interface.
api.selectVisual({family:'empty_glassware',state:{fill:3}});
api.selectVisual({family:'bottled_drink',state:{drink:'brandy',count:1}});

api.selectVisual({family:'bottled_drink',state:{drink:'brandy',count:3}});
api.selectVisual({family:'bottled_drink',state:{drink:'watermelon_juice',count:4}});
api.selectVisual({family:'bottled_drink',state:{drink:'glowflower_brew',count:4}});
api.selectVisual({family:'cocktail',state:{drink:'white_lady'}});
api.selectVisual({family:'cocktail',state:{drink:'signature_cocktail'}});
api.selectVisual({family:'shaker'});
// @ts-expect-error Original Brandy has only three placements, not four.
api.selectVisual({family:'bottled_drink',state:{drink:'brandy',count:4}});
// @ts-expect-error Same per-family bound for Carignan.
api.selectVisual({family:'bottled_drink',state:{drink:'carignan',count:4}});
// A10: Grasshopper now resolves to its own original model.
api.selectVisual({family:'cocktail',state:{drink:'grasshopper'}});

api.selectVisual({family:'bar_counter',state:{shape:'right_corner'}});
api.selectVisual({family:'cocktail',state:{drink:'nether_special'}});
// @ts-expect-error No unverified counter shape is fabricated.
api.selectVisual({family:'bar_counter',state:{shape:'diagonal'}});
// @ts-expect-error Unknown drink remains rejected.
api.selectVisual({family:'cocktail',state:{drink:'missing_cocktail'}});

api.selectVisual({family:'table',state:{shape:'middle_rot'}});
api.selectVisual({family:'pendant_lamp',state:{style:'bell',section:'assembled'}});
// @ts-expect-error Only the plain board parts and inspection assembly are ported.
api.selectVisual({family:'sandwich_board',state:{section:'flower'}});
// @ts-expect-error No red lamp source in this batch.
api.selectVisual({family:'pendant_lamp',state:{style:'red',section:'top'}});

api.selectVisual({family:'incense',state:{variant:'sakura',state:'open'}});
api.selectVisual({family:'painting',state:{work:'mondrian'}});
api.selectVisual({family:'bar_stool',state:{color:'blue'}});
// All sixteen stool colors are now covered.
api.selectVisual({family:'bar_stool',state:{color:'green'}});

api.selectVisual({family:'painting',state:{work:'tartaric_acid'}});
api.selectVisual({family:'bar_stool',state:{color:'red'}});
api.selectVisual({family:'string_lights',state:{color:'blue'}});
// All seventeen source light designs are now covered.
api.selectVisual({family:'string_lights',state:{color:'red'}});

// A17 pure visual-state bridge: implementation readiness without a game runtime.
import { liquidFrame, boardRotation, shakerSourcePose, rgbProperties } from '../sdk/visual-state.mjs';
const vf = liquidFrame('pressing_tub', 500);
const y: number = vf.yBlocks;
const eventName: string = boardRotation(12).event;
const hand = shakerSourcePose(20.5, 'right', true);
const red: number = rgbProperties(255, 0, 0)['kt_art:red'];
// @ts-expect-error Unknown fixture must not silently map to a valid capacity.
liquidFrame('ocean', 10);
// @ts-expect-error Invalid hand name must not be accepted.
shakerSourcePose(2, 'both');

api.selectVisual({family:'decorated_board',state:{variant:'sunflower'}});
api.selectVisual({family:'board_parts',state:{variant:'wither_rose'}});
api.selectVisual({family:'chalkboard',state:{size:'large'}});
api.selectVisual({family:'item_display',state:{item:'kaleidoscope_tavern:barrel'}});
api.selectVisual({family:'bottle_display',state:{variant:'molotov'}});
api.selectVisual({family:'string_lights',state:{color:'colorless'}});
// @ts-expect-error A17 does not invent an ultraviolet design.
api.selectVisual({family:'string_lights',state:{color:'ultraviolet'}});
// @ts-expect-error Unsupported floral artwork.
api.selectVisual({family:'decorated_board',state:{variant:'rose_red'}});
// @ts-expect-error No arbitrary item can be assumed to have an item-side model.
api.selectVisual({family:'item_display',state:{item:'minecraft:bedrock'}});
