cd IMa
if hash mpicxx 2>/dev/null; then
	make all
else
	make singlecpu
fi
