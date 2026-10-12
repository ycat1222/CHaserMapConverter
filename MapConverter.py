import json
import sys


class MapConverter:
    __default_turn_count = 100

    @staticmethod
    def _validate_layout(layout: list) -> list:
        """レイアウトが仕様通りの 15x17 形式かを検証する。"""
        # 17行あることを確認し、各行が 15文字であることを検証する
        if len(layout) != 17:
            raise ValueError("Map size must be 15x17.")

        for row in layout:
            if len(row) != 15:
                raise ValueError("Map size must be 15x17.")

        return layout

    @staticmethod
    def _load_map_file(mapFileName: str) -> tuple[str, list[str], tuple[int, int], tuple[int, int]]:
        """.map ファイルを読み込み、名前・レイアウト・プレイヤー位置を抽出する。"""
        # 余分な空行を除いた上で各行を読み取り、処理しやすい形に整える
        with open(mapFileName, "r", encoding="utf-8") as map_file:
            lines = [line.strip() for line in map_file if line.strip()]

        if not lines:
            raise ValueError("Map file is empty.")

        # 変換に必要なフィールドを保持する変数を初期化する
        name = None
        turn = None # JSON形式に変換する際は使用しない
        size = None
        layout = []
        cool_pos = None
        hot_pos = None

        # 1行ずつ解析し、マップ名・サイズ・レイアウト・プレイヤー位置を抽出する
        for line in lines:
            # マップ名
            if line.startswith("N:"):
                name = line[2:].strip()

            # ターン数 (JSON形式に変換する際は使用しない)
            elif line.startswith("T:"):
                turn = int(line[2:].strip())

            # マップサイズ
            elif line.startswith("S:"):
                size = tuple(int(value) for value in line[2:].split(","))

            # マップレイアウト
            elif line.startswith("D:"):
                row_text = line[2:].strip()
                row = [cell.strip() for cell in row_text.split(",")]
                if len(row) != 15:
                    raise ValueError("Map size must be 15x17.")
                layout.append("".join(row))

            # プレイヤー位置
            elif line.startswith("C:"):
                cool_pos = tuple(int(value) for value in line[2:].split(","))
            elif line.startswith("H:"):
                hot_pos = tuple(int(value) for value in line[2:].split(","))

        # サイズが 15x17 でない場合は変換を許可しない
        if size is not None and size != (15, 17):
            raise ValueError("Map size must be 15x17.")

        # 必須情報が欠けていないか確認する
        if name is None or cool_pos is None or hot_pos is None:
            raise ValueError("Map file is missing required information.")

        MapConverter._validate_layout(layout)
        return name, layout, cool_pos, hot_pos

    @staticmethod
    def _write_map_file(mapFileName: str, name: str, layout: list[str], cool_pos: tuple[int, int], hot_pos: tuple[int, int]):
        """JSON から読み取ったレイアウトを .map 形式で書き出す。"""
        # .map 形式では C/H を座標行に書くため、内部では 0 に置き換えた行を用意する
        rows = []
        for row in layout:
            rows.append("D:" + ",".join(row.replace("C", "0").replace("H", "0")))

        # .map 形式のヘッダとデータ行を順に出力する
        with open(mapFileName, "w", encoding="utf-8") as map_file:
            map_file.write(f"N:{name}\n")
            map_file.write(f"T:{MapConverter.__default_turn_count}\n")
            map_file.write("S:15,17\n")
            map_file.writelines(line + "\n" for line in rows)
            map_file.write(f"C:{cool_pos[0]},{cool_pos[1]}\n")
            map_file.write(f"H:{hot_pos[0]},{hot_pos[1]}\n")

    @staticmethod
    def convertMapToJson(mapFileName: str, outputJsonFileName: str):
        """.map 形式を JSON 形式へ変換する。"""
        try:
            # .map ファイルからマップ名・レイアウト・プレイヤー位置を読み込む
            name, layout, cool_pos, hot_pos = MapConverter._load_map_file(mapFileName)

            # Cool/Hot の座標を JSON のレイアウト文字列に反映する
            layout_with_players = []
            for y, row in enumerate(layout):
                row_chars = list(row)
                if cool_pos is not None and cool_pos[1] == y:
                    row_chars[cool_pos[0]] = "C"
                if hot_pos is not None and hot_pos[1] == y:
                    row_chars[hot_pos[0]] = "H"
                layout_with_players.append("".join(row_chars))

            payload = {
                "id": 1,
                "name": name,
                "description": "",
                "layout": MapConverter._validate_layout(layout_with_players),
            }

            # JSON 形式で出力する
            with open(outputJsonFileName, "w", encoding="utf-8") as json_file:
                json.dump(payload, json_file, ensure_ascii=False, indent=2)
                json_file.write("\n")
        except Exception as exc:
            print(f"Error: {exc}")
            sys.exit(1)

    @staticmethod
    def convertJsonToMap(jsonFileName: str, outputMapFileName: str):
        """JSON 形式を .map 形式へ変換する。"""
        try:
            # JSON ファイルを読み込み、必要なキーがあるか確認する
            with open(jsonFileName, "r", encoding="utf-8") as json_file:
                payload = json.load(json_file)

            required_keys = {"id", "name", "description", "layout"}
            if not required_keys.issubset(payload.keys()):
                raise ValueError("JSON file must contain id, name, description, and layout.")

            name = payload["name"]
            layout = payload["layout"]
            layout = MapConverter._validate_layout(layout)

            # C/H の座標を拾い、出力用の .map 形式に合わせて 0 に置き換える
            cool_pos = None
            hot_pos = None
            normalized_layout = []
            for y, row in enumerate(layout):
                row_copy = list(row)
                for x, cell in enumerate(row_copy):
                    if cell == "C":
                        if cool_pos is not None:
                            raise ValueError("Layout must contain exactly one C marker.")
                        cool_pos = (x, y)
                        row_copy[x] = "0"
                    elif cell == "H":
                        if hot_pos is not None:
                            raise ValueError("Layout must contain exactly one H marker.")
                        hot_pos = (x, y)
                        row_copy[x] = "0"

                normalized_layout.append("".join(row_copy))

            if cool_pos is None or hot_pos is None:
                raise ValueError("Layout must contain both C and H markers.")

            # .map 形式の出力を行う
            MapConverter._write_map_file(outputMapFileName, name, normalized_layout, cool_pos, hot_pos)
        except Exception as exc:
            print(f"Error: {exc}")
            sys.exit(1)


if __name__ == "__main__":
    # コマンドライン引数の数を確認し、使い方を表示する
    import sys
    if len(sys.argv) != 3:
        print("Usage: python MapConverter.py <input_file> <output_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    # 拡張子で変換モードを判定する
    if input_file.endswith(".map"):
        #出力ファイル名の拡張子が json でなければ、拡張子をjsonにする
        if not output_file.endswith(".json"):
            output_file += ".json"
        # .map 形式を JSON 形式へ変換する
        MapConverter.convertMapToJson(input_file, output_file)

    elif input_file.endswith(".json"):
        #出力ファイル名の拡張子が map でなければ、拡張子をmapにする
        if not output_file.endswith(".map"):
            output_file += ".map"
        MapConverter.convertJsonToMap(input_file, output_file)

    else:
        print("Invalid input file format. Use a .map file or a .json file.")
        sys.exit(1)

    print("Conversion complete.")
