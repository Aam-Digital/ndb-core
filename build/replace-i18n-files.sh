# Replace relevant i18n-files in the dist
# Currently, only the How_To-File is replaced
cd "$1" || exit 1
for locale in *; do
  assets_dir="${locale}/assets"
  locale_dir="${assets_dir}/locale"
  locale_file="${locale_dir}/How_To.${locale}.md"

  if test -f "$locale_file"; then
    rm "${assets_dir}/How_To.md"
    mv "$locale_file" "$assets_dir/How_To.md"
    echo "\e[32mMoved ${locale_file} to assets"
  else
    echo "\e[91mfile ${locale_file} does not exist"
    echo "\e[91mIgnore this warning if ${locale} is the root-locale"
  fi

  rm -r "${locale_dir}"
  echo "\e[32mremoved ${locale_dir}"
done
