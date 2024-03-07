import json
from transformers import BertTokenizer, BertForSequenceClassification, XLNetTokenizer, XLNetForSequenceClassification, RobertaTokenizer, RobertaForSequenceClassification
from torch.nn.functional import softmax
import torch
import re

# Paths to the fine-tuned models
bert_model_path = r"/Users/shashankmittal/Documents/Developer/Titans_dpbh23/models/Titans_DPBH_BERT_Fine_Tuned_Model"
xlnet_model_path = r"/Users/shashankmittal/Documents/Developer/Titans_dpbh23/models/Titans_DPBH_XLNet_Fine_Tuned_Model"
roberta_model_path = r"/Users/shashankmittal/Documents/Developer/Titans_dpbh23/models/Titans_DPBH_ROBERT_Fine_Tuned_Model"

# Load models and tokenizers
bert_tokenizer = BertTokenizer.from_pretrained(bert_model_path)
bert_model = BertForSequenceClassification.from_pretrained(bert_model_path)

xlnet_tokenizer = XLNetTokenizer.from_pretrained("xlnet-base-cased")
xlnet_model = XLNetForSequenceClassification.from_pretrained(xlnet_model_path)

roberta_tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
roberta_model = RobertaForSequenceClassification.from_pretrained(roberta_model_path)

max_seq_length = 512

def preprocess_text(tokenizer, text):
    tokens = tokenizer.tokenize(tokenizer.decode(tokenizer.encode(text, add_special_tokens=True, max_length=max_seq_length, truncation=True)))
    return tokens

def predict_dark_patterns(models, tokenizers, input_text):
    votes = []

    for model, tokenizer in zip(models, tokenizers):
        input_ids = tokenizer.encode(preprocess_text(tokenizer, input_text), return_tensors='pt', max_length=max_seq_length, truncation=True)

        with torch.no_grad():
            outputs = model(input_ids)

        probs = softmax(outputs.logits, dim=1).squeeze()
        predicted_category = torch.argmax(probs).item()

        votes.append(predicted_category)

    return votes

def count_dark_patterns_with_text(text_file):
    with open(text_file, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    # Map category names to numeric labels
    category_mapping = {"Urgency": 0, "Not Dark Pattern": 1, "Scarcity": 2, "Misdirection": 3, "Social Proof": 4,
                        "Obstruction": 5, "Sneaking": 6, "Forced Action": 7}

    dark_patterns = {category: {"count": 0, "text_strings": []} for category in category_mapping}

    for line in lines:
        if not line.strip():
            continue

        individual_predictions = predict_dark_patterns([bert_model, xlnet_model, roberta_model],
                                                      [bert_tokenizer, xlnet_tokenizer, roberta_tokenizer],
                                                      line)

        # Get majority voted prediction
        majority_category = max(set(individual_predictions), key=individual_predictions.count)
        category_name = next(key for key, value in category_mapping.items() if value == majority_category)

        if category_name == "Not Dark Pattern":
            continue  # Skip "Not Dark Pattern" category

        dark_patterns[category_name]["count"] += 1
        dark_patterns[category_name]["text_strings"].append(line.strip())

    return dark_patterns

# Assuming 'scraped.txt' is in the same directory as the models
result_with_text = count_dark_patterns_with_text('scraped.txt')

for category, info in result_with_text.items():
    print(f"{category}: {info['count']} occurrences")
    print(f"Text strings: {info['text_strings']}")

# Save the result to a JSON file
with open('result.json', 'w') as json_file:
    json.dump(result_with_text, json_file)