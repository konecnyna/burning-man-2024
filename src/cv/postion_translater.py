


def translate_img_coordinates(event_x, event_y, img):
    img_height, img_width, _ = img.shape
    inverted_x = img_width - event_x

    box_width, box_height = 1920, 1080
    translated_x = int(inverted_x * (box_width / img_width))
    translated_y = int(event_y * (box_height / img_height))
    return (translated_x, translated_y)