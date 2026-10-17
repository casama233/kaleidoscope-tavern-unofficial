import java.util.Random;

/** Actual JDK Random draws, independently consumed by the JavaScript regression.
 * Each seed starts two identical generators. Truncating nextDouble to its high
 * 24 bits must equal the first nextFloat draw. This does not claim a shared
 * cross-engine seeded stream after subsequent draws.
 */
public class JavaRandomFloatOracle {
    public static void main(String[] args) {
        for (int seed = 0; seed < 256; seed++) {
            double input = new Random(seed).nextDouble();
            float expected = new Random(seed).nextFloat();
            System.out.println("{\"seed\":" + seed + ",\"input\":" + input + ",\"expected\":" + expected + "}");
        }
    }
}
