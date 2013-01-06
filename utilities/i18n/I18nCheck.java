/*
 * Usage: run.sh PATH_TO_APP_SOURCE
 * Checks for a base.strings.json file which is your English or base translation
 * Compares all keys against all resources/xyz/strings.json files
 * If any are missing, it lets you know.
 * Also ensures that the files don't have the BOM header that breaks webOS
 */
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.google.gson.JsonParseException;

import java.lang.reflect.Type;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.io.IOException;
import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.PrintStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.channels.FileChannel;
import java.nio.MappedByteBuffer;
import java.nio.charset.Charset;

public class I18nCheck {
	private	Gson gson = new Gson();
	private String baseDir;
	private static String BASE_NAME = "__BASE__";
	private Map<String, Map<String, String>> trStrings = new LinkedHashMap<String, Map<String, String>>();

	public static void main(String[] args) throws IOException {
		if (args.length != 1) {
			System.err.println("Usage: I18nCheck <baseDir>");
			return;
		}
		String baseDir = args[0];

		I18nCheck checker = new I18nCheck(baseDir);

		Map<String, Map<String, String>> missing = checker.findMissing();
		Map<String, Map<String, String>> fix = new LinkedHashMap<String, Map<String, String>>();

		PrintStream out = new PrintStream(System.out, true, "UTF-8");
		if (missing.keySet().size() > 0) { out.println("Missing:"); }
		for (String key : missing.keySet()) {
			out.println("  " + key);
			Map<String, String> entry = missing.get(key);
			for (String lang : entry.keySet()) {
				out.println("  - " + lang + ": " + entry.get(lang));
				if (entry.get(lang) == "(null)") {
					Map<String, String> langFix = fix.get(lang);
					if (langFix == null) {
						langFix = new LinkedHashMap<String, String>();
						fix.put(lang, langFix);
					}
					langFix.put(key, entry.get(lang));
				}
			}
		}

		if (fix.keySet().size() > 0) { out.println("\n\nEmail:\n"); }
		for (String lang : fix.keySet()) {
			out.println("Lanugage: " + lang);
			Map<String, String> entry = fix.get(lang);
			for (String key : entry.keySet()) {
				out.println("\t" + key + ": " + missing.get(key).get(BASE_NAME));
			}
			out.println("\n");
		}
	}

	public I18nCheck(String baseDir) throws IOException {
		this.baseDir = baseDir + "/resources";
		loadBase();
		loadTranslations();
	}

	private void loadBase() throws IOException {
		System.err.println("Loading base strings...");
		try {
			trStrings.put(BASE_NAME, loadStrings(baseDir + "/base.strings.json"));
		} catch (IOException e) {
			System.err.println("Error loading base strings.  Ensure you have resources/base.strings.json in your project");
			throw e;
		}
	}

	private void loadTranslations() throws IOException {
		System.err.print("Loading translations...");
		File resources = new File(baseDir);
		File[] dirs = resources.listFiles(new FileFilter() {
			public boolean accept(File file) {
				return file.isDirectory();
			}
		});

		for (File langDir : dirs) {
			String langName = langDir.getName();
			String langPath = langDir.getPath();
			System.out.print(langName + "...");

			try {
				trStrings.put(langName, loadStrings(langPath + "/strings.json"));
			} catch (RuntimeException e) {
				System.err.println("Error loading strings for " + langName);
				throw e;
			}

		}
		System.out.println("");
	}

	public Map<String, Map<String, String>> findMissing() {
		Map<String, Map<String, String>> missing = new LinkedHashMap<String, Map<String, String>>();

		for (String sourceLang : trStrings.keySet()) {
			for (String key : trStrings.get(sourceLang).keySet()) {
				for (String lang : trStrings.keySet()) {
					if (sourceLang != lang) {
						if (null == trStrings.get(lang).get(key)) {
							Map<String, String> entry = missing.get(key);
							if (null == entry) {
								entry = new LinkedHashMap<String, String>();
								missing.put(key, entry);
							}
							entry.put(sourceLang, trStrings.get(sourceLang).get(key));
							entry.put(lang, "(null)");
						}
					}
				}
			}
		}

		return missing;
	}

	private Map<String, String> loadStrings(String path) throws IOException {
		String json = readFromFile(path);
		Type jsonType = new TypeToken<Map<String, String>>(){}.getType();
		Map<String, String> map = null;
		try {
			map = gson.fromJson(json, jsonType);
		} catch (JsonParseException e) {
			System.err.println("Error parsing JSON, ensure you don't have the BOM");
			throw e;
		}
		return map;
	}

	private String readFromFile(String path) throws IOException {
		BufferedReader read = new BufferedReader(new InputStreamReader(new FileInputStream(new File(path)), Charset.forName("UTF8")));
		String currentLine;
		StringBuffer result = new StringBuffer();
		while ((currentLine = read.readLine()) != null) {
			result.append(currentLine);
		}
		return result.toString();

		/*
		FileInputStream stream = new FileInputStream(new File(path));
		try {
			FileChannel fc = stream.getChannel();
			MappedByteBuffer bb = fc.map(FileChannel.MapMode.READ_ONLY, 0, fc.size());
			return Charset.forName("UTF8").defaultCharset().decode(bb).toString();
		} finally {
			stream.close();
		}
	*/
	}
}
